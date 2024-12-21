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
            
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'broadcast_game_started',
                    'message': 'The game has started!',
                }
            )
            # await self.broadcast_game_state()
            return
        # Broadcast updated state to ALL clients in the group
        await self.broadcast_room_update()

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
        await self.send(text_data=json.dumps(event['state']))

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
