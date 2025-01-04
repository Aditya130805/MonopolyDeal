from channels.generic.websocket import AsyncWebsocketConsumer
import json
from game.game import Game
from channels.db import database_sync_to_async
import asyncio

class GameConsumer(AsyncWebsocketConsumer):
    
    game_instances = {}
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.player_id = None
        self.room_id = None
        self.game_group_name = None
        self.connection_rejected = False
    
    async def checkValid(self, room_id, game_group_name, player_id):
        """
        Check if the player can join the room.
        """
        self.player_id = player_id
        room = await self.get_room_by_id(room_id)
        if not room:
            await self.reject_connection("Room does not exist")
            return
        user = await self.get_user_by_unique_id(player_id)
        if not user:
            await self.reject_connection("User not found")
            return
        if room.has_started:
            await self.reject_connection("The game has already begun")
            return
        
        # Check if player is already in the room
        player_exists = any(player['id'] == str(user.unique_id) for player in room.players)
        if player_exists:
            await self.reject_connection("You are already in this room! Player:" + user.username)
            return
        if room.player_count >= room.max_players:
            await self.reject_connection("Room is full.")
            return
        
        # Add player to room
        await self.add_player_to_room(room, user)

        # Add player to game group
        await self.channel_layer.group_add(game_group_name, self.channel_name)

    async def connect(self):
        """
        Handle WebSocket connection establishment.
        """
        # Get room_id from URL parameters
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.game_group_name = f'game_{self.room_id}'
        self.player_id = None
        await self.accept()

    async def disconnect(self, close_code):
        """
        Handle WebSocket disconnection.
        """
        if not hasattr(self, 'room_id'):
            return  # Connection was never fully established
            
        # Check if this was a rejected connection
        if getattr(self, 'connection_rejected', False):
            print("Rejected connection, skipping disconnect handling.")
            return
            
        if self.player_id:
            await self.remove_player_from_room(self.player_id)
        
        # Remove from game group
        await self.channel_layer.group_discard(self.game_group_name, self.channel_name)
        
        # Broadcast updated state to remaining players
        await self.broadcast_room_update()

    async def receive(self, text_data):
        """
        Handle incoming WebSocket messages.
        """
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'establish_connection':
            player_id = str(data.get('player_id'))
            await self.checkValid(self.room_id, self.game_group_name, player_id)
        elif action == 'player_ready':
            readiness = data.get('isReady')
            await self.set_player_ready(readiness)
        elif action == 'start_game':
            # Create a new game instance for this room
            room = await self.get_room_by_id(self.room_id)
            await self.mark_game_start_db(room)
            GameConsumer.game_instances[self.room_id] = Game(room.players)
            # Draw 2 cards for the first player
            game_state = GameConsumer.game_instances[self.room_id]
            first_player = game_state.players[game_state.turn_index]
            first_player.draw_cards(game_state.deck, 2)
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'broadcast_game_started',
                    'message': 'The game has started!',
                }
            )
            return
        elif action == 'initial_game_state':
            await self.broadcast_game_state()
            return
        elif action == 'skip_turn':
            game_state = GameConsumer.game_instances[self.room_id]
            player_id = data.get('player')
            if player_id == str(game_state.players[game_state.turn_index].id):
                game_state.actions_remaining = 1  # This will trigger the turn switch in handle_action
                await self.handle_action('skip', None, player_id)  # This will process the action and switch turns
            return
        else:
            # Game actions
            card = data.get('card')
            player_id = data.get('player')
            print("GAME ACTIONS:")
            await self.handle_action(action, card, player_id)

        # Broadcast updated state to ALL clients in the group
        await self.broadcast_room_update()

    async def handle_action(self, action, card, player_id):
        print("CARD:", card)
        game_state = GameConsumer.game_instances[self.room_id]
        player = next((p for p in game_state.players if p.id == player_id), None)
        
        if action == 'to_bank':
            if player:
                card_to_move = next((c for c in player.hand if c.id == card['id']), None)
                if card_to_move:
                    player.hand.remove(card_to_move)
                    player.bank.append(card_to_move)
        elif action == 'to_properties':
            if player:
                card_to_move = next((c for c in player.hand if c.id == card['id']), None)
                if card_to_move:
                    card_to_move.current_color = card['currentColor']
                    player.hand.remove(card_to_move)
                    if not player.properties.get(card_to_move.current_color):
                        player.properties[card_to_move.current_color] = []
                    player.properties[card_to_move.current_color].append(card_to_move)    
        
        elif action == 'pass_go':
            if player:
                card_to_move = next((c for c in player.hand if c.id == card['id']), None)
                if card_to_move:
                    player.hand.remove(card_to_move)
                    player.draw_cards(game_state.deck, 2)
        
        elif action == 'skip':
            pass        
        
        if game_state.actions_remaining == 1:
            # Switch to next player's turn
            game_state.turn_index = (game_state.turn_index + 1) % len(game_state.players)
            game_state.actions_remaining = 3
            next_player = game_state.players[game_state.turn_index]
            if len(next_player.hand) == 0:
                next_player.draw_cards(game_state.deck, 5)
            else:
                next_player.draw_cards(game_state.deck, 2)
        else:
            game_state.actions_remaining -= 1
        
        await self.broadcast_game_state()

    async def reject_connection(self, reason):
        """
        Reject a WebSocket connection with a specified reason.
        """
        self.connection_rejected = True
        print(f"Room {self.room_id}: {reason}, rejecting connection")
        await self.send(text_data=json.dumps({
            'type': 'rejection',
            'data': reason
        }))
        await self.close()

    async def broadcast_game_started(self, event):
        # This method will be called when a game has started
        await self.send(text_data=json.dumps({
            'type': 'broadcast_game_started',
            'message': event.get('message', 'The game has started!'),
        }))

    async def broadcast_game_state(self):
        """
        Broadcast the current game state to all clients in the group.
        """
        if self.room_id in GameConsumer.game_instances:
            state = GameConsumer.game_instances[self.room_id].to_dict()
            print("STATE:",state)
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'game_update',
                    'state': state
                }
            )

    async def broadcast_room_update(self):
        """
        Broadcast the updated room state to all clients in the group.
        """
        print(await self.get_room_data_by_id(self.room_id))
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'room_update',
                'data': await self.get_room_data_by_id(self.room_id)
            }
        )

    async def game_update(self, event):
        """
        Send game state update to WebSocket.
        """
        await self.send(text_data=json.dumps({
            'type': 'game_update',
            'state': event['state']
        }))

    async def room_update(self, event):
        """
        Send room state update to WebSocket.
        """
        await self.send(text_data=json.dumps(event['data']))

    @database_sync_to_async
    def mark_game_start_db(self, room):
        """
        Mark the game as started and update the database.
        """
        room.has_started = True
        room.save()

    @database_sync_to_async
    def get_room_by_id(self, room_id):
        """
        Retrieve a game room by its ID.
        """
        from backend.game.models import GameRoom
        try:
            return GameRoom.objects.get(room_id=room_id)
        except GameRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def get_room_data_by_id(self, room_id):
        """
        Retrieve the room data by its ID.
        """
        from backend.game.models import GameRoom
        try:
            room = GameRoom.objects.get(room_id=room_id)
            room_data = {
                'id': room_id,
                'player_count': room.player_count,
                'max_players': room.max_players,
                'has_started': room.has_started,
                'players': room.players
            }
            return room_data
        except GameRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def get_user_by_unique_id(self, unique_id):
        """
        Querying the user by unique_id
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(unique_id=unique_id)
            return user
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def add_player_to_room(self, room, user):
        """
        Add a player to the room and update the database.
        """
        room.players.append({'id': str(user.unique_id), 'name': user.username, 'isReady': False})
        room.player_count += 1
        room.save()

    @database_sync_to_async
    def remove_player_from_room(self, player_id):
        """
        Remove a player from the room and update the database.
        """
        from backend.game.models import GameRoom
        try:
            room = GameRoom.objects.get(room_id=self.room_id)
            room.players = [player for player in room.players if player['id'] != player_id]
            room.player_count -= 1
            room.save()
            """CHANGE IF YOU WANT TO REMOVE GAME ROOM FROM DATABASE IF NO PLAYERS IN"""
            if room.player_count <= 0:
                GameRoom.objects.filter(room_id=self.room_id).delete()
        except GameRoom.DoesNotExist:
            pass

    @database_sync_to_async
    def set_player_ready(self, readiness):
        from backend.game.models import GameRoom
        try:
            room = GameRoom.objects.get(room_id=self.room_id)
            for player in room.players:
                if player['id'] == self.player_id:
                    player['isReady'] = readiness
                    room.save()
        except GameRoom.DoesNotExist:
            pass
