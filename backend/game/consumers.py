from channels.generic.websocket import AsyncWebsocketConsumer
import json
from backend.game_core.game import Game
from channels.db import database_sync_to_async
import asyncio
import random

class GameConsumer(AsyncWebsocketConsumer):
    
    game_instances = {}
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.player_id = None
        self.room_id = None
        self.game_group_name = None
        self.connection_rejected = False
        
    ########## CONNECTION HANDLING ##########
    
    async def add_player_to_room(self, room_id, game_group_name, player_id):
        """
        Check if the player can join the room.
        """
        self.player_id = player_id
        room = await self.db_get_room_by_id(room_id)
        if not room:
            await self.reject_connection("Room does not exist")
            return
        user = await self.db_get_user_by_unique_id(player_id)
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
        await self.db_add_player_to_room(room, user)

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
            # Get room and check if game has started
            room = await self.db_get_room_by_id(self.room_id)
            
            # If game is in progress, notify other players about the disconnection
            if room and room.has_started:
                # Get the disconnected player's username for the notification
                user = await self.db_get_user_by_unique_id(self.player_id)
                username = user.username if user else "Unknown player"
                
                # Broadcast player disconnection to all players in the room
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'broadcast_player_disconnected',
                        'player_id': str(self.player_id),
                        'username': username
                    }
                )

            # Remove player from room
            await self.db_remove_player_from_room(self.player_id)
        
        # Remove from game group
        await self.channel_layer.group_discard(self.game_group_name, self.channel_name)
        
        # Broadcast updated state to remaining players
        await self.send_room_update()

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

    def calculate_state_diff(self, previous_state, current_state):
        """
        Calculate the difference between previous and current game states.
        Returns a dictionary containing only the changed values.
        """
        diff = {}
        
        # Handle simple fields
        for key in ['deck_count', 'current_turn', 'actions_remaining', 'winner']:
            if previous_state.get(key) != current_state.get(key):
                diff[key] = current_state.get(key)
        
        # Handle discard pile changes
        if previous_state.get('discard_pile') != current_state.get('discard_pile'):
            diff['discard_pile'] = current_state.get('discard_pile')
        
        # Handle player changes
        if 'players' in current_state:
            player_diffs = []
            current_players = {p['id']: p for p in current_state['players']}
            previous_players = {p['id']: p for p in previous_state.get('players', [])}
            
            for player_id, current_player in current_players.items():
                player_diff = {}
                if player_id in previous_players:
                    prev_player = previous_players[player_id]
                    # Check each player attribute for changes
                    for attr in ['hand', 'bank', 'properties']:
                        if current_player.get(attr) != prev_player.get(attr):
                            player_diff[attr] = current_player.get(attr)
                else:
                    # New player, include all data
                    player_diff = current_player
                
                if player_diff:
                    player_diff['id'] = player_id  # Always include ID for reference
                    player_diffs.append(player_diff)
            
            if player_diffs:
                diff['players'] = player_diffs
        
        return diff
    
    async def receive(self, text_data):
        """
        Handle incoming WebSocket messages.
        """
        data = json.loads(text_data)
        action = data.get('action')

        ##### ROOM MANAGEMENT #####
        if action == 'establish_connection':
            player_id = str(data.get('player_id'))
            await self.add_player_to_room(self.room_id, self.game_group_name, player_id)
            await self.send_room_update()
        elif action == 'player_ready':
            readiness = data.get('isReady')
            await self.db_set_player_ready(readiness)
            await self.send_room_update()

        ##### GAME MANAGEMENT #####
        elif action == 'start_game':
            # Create a new game instance for this room
            room = await self.db_get_room_by_id(self.room_id)
            await self.db_mark_game_start(room)
            
            # Shuffle players to randomize turn order
            shuffled_players = list(room.players)
            random.shuffle(shuffled_players)
            
            # Create game with shuffled players
            GameConsumer.game_instances[self.room_id] = Game(shuffled_players)
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
        elif action == 'initial_game_state':
            # For initial game state, always send the full state
            await self.send_game_state(full_state=True)
        elif action == 'skip_turn':
            game_state = GameConsumer.game_instances[self.room_id]
            player_id = data.get('player')
            if player_id == str(game_state.players[game_state.turn_index].id):
                game_state.actions_remaining = 1  # This will trigger the turn switch in manage_turns
                self.manage_turns(game_state)  # This will switch turns
                await self.send_game_state()
        
        ###### GAME ACTIONS ######
        no_turn_actions = {'just_say_no_choice', 'just_say_no_response', 'rent_request', 'rent_payment', 'rent_paid'}
        card = data.get('card')
        if not card:
            # No card was provided (e.g., player dragged a card already played due to really quick dragging)
            return
        if action in no_turn_actions:
            await self.handle_action_without_notification(data)
        else:
            game_state = GameConsumer.game_instances[self.room_id]
            await self.handle_action_with_notification(data)
            self.manage_turns(game_state)
            await self.send_game_state()
    
    async def handle_action_without_notification(self, data):
        action = data.get('action')
        if action == 'just_say_no_choice':
            await self.play_just_say_no_choice(data)
        elif action == 'just_say_no_response':
            await self.play_just_say_no_response(data)
        elif action == 'rent_request': 
            await self.play_rent_request(data)
        elif action == 'rent_payment':
            await self.play_rent_payment(data)
        elif action == 'rent_paid':
            await self.play_rent_paid(data)

    async def handle_action_with_notification(self, data):
        card = data.get('card')
        player_id = data.get('player')
        action = data.get('action')
        game_state = GameConsumer.game_instances[self.room_id]
        player = next((p for p in game_state.players if p.id == player_id), None)
        
        # Send card played notification before handling the action
        if card:  # Only send if there's a card being played
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'broadcast_card_played',
                    'player_id': player_id,
                    'action': action,
                    'action_type': 'to_bank' if action == 'to_bank' else 'to_properties' if action == 'to_properties' else 'action',
                    'card': card
                }
            )
        
        if action == 'to_bank':
            self.play_to_bank(player, card['id'])
            
        elif action == 'to_properties':
            self.play_to_properties(player, card['id'], card['currentColor'])  
            
        elif action == 'pass_go':
            self.play_pass_go(game_state, player, card['id'])
            
        elif action == "it's_your_birthday":
            await self.play_its_your_birthday(game_state, player, card['id'])
            
        elif action == 'debt_collector':
            await self.play_debt_collector(game_state, player, data['targetPlayer'], card['id'])
            
        elif action == 'multicolor rent':
            await self.play_multicolor_rent(game_state, player, card['id'], data.get('rentAmount'), data.get('targetPlayer'))
            
        elif action == 'rent':
            await self.play_initial_rent(game_state, player, card, data.get('rentAmount'))
            
        elif action == 'sly_deal':
            await self.play_sly_deal(game_state, player, card['id'], data.get('target_property')['id'])
            
        elif action == 'forced_deal':
            await self.play_forced_deal(game_state, player, card['id'], data.get('target_property')['id'], data.get('user_property')['id'])
            
        elif action == 'deal_breaker':
            await self.play_deal_breaker(game_state, player, card['id'], data.get('target_set'), data.get('target_color'))
            
        elif action == 'double_the_rent':
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'broadcast_card_played',
                    'player_id': player_id,
                    'action': action,
                    'action_type': 'to_bank' if action == 'to_bank' else 'to_properties' if action == 'to_properties' else 'action',
                    'card': data.get('double_the_rent_card')
                }
            )
            await self.play_double_the_rent(game_state, player, card['id'], data.get('double_the_rent_card')['id'], data.get('rentAmount'), data.get('targetPlayer') or None)
            self.manage_turns(game_state)  # The additional turn is handled here

    def play_to_bank(self, player, card_id):
        card_to_play = next((c for c in player.hand if c.id == card_id), None)
        if card_to_play:
            player.hand.remove(card_to_play)
            player.bank.append(card_to_play)

    def play_to_properties(self, player, card_id, color):
        card_to_play = next((c for c in player.hand if c.id == card_id), None)
        if card_to_play:
            card_to_play.current_color = color
            player.hand.remove(card_to_play)
            if not player.properties.get(card_to_play.current_color):
                player.properties[card_to_play.current_color] = []
            player.properties[card_to_play.current_color].append(card_to_play) 

    def play_pass_go(self, game_state, player, card_id):
        card_to_play = next((c for c in player.hand if c.id == card_id), None)
        if card_to_play:
            player.hand.remove(card_to_play)
            player.draw_cards(game_state.deck, 2)
            game_state.discard_pile.append(card_to_play)
    
    async def play_its_your_birthday(self, game_state, player, card_id):
        card_to_play = next((c for c in player.hand if c.id == card_id), None)
        if not card_to_play:
            return
        player.hand.remove(card_to_play)
        # Send rent request
        game_state.player_ids_to_pay = [p.id for p in game_state.players if p.id != player.id]
        game_state.num_players_owing = len(game_state.player_ids_to_pay)
        game_state.total_paying_players = len(game_state.player_ids_to_pay)
        game_state.rent_amount = 2  # It's Your Birthday cards request 2M
        game_state.rent_type = "it's your birthday"
        game_state.rent_card = card_to_play
        game_state.rent_recipient_id = str(player.id)
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'broadcast_rent_pre_request',
                'amount': game_state.rent_amount,
                'recipient_id': game_state.rent_recipient_id,
                'target_player_id': str(game_state.player_ids_to_pay[0]),
                'total_players': game_state.total_paying_players,
                'num_players_owing': game_state.num_players_owing,
                'card': game_state.rent_card.to_dict()  # Convert card object to dictionary
            }
        )
        game_state.discard_pile.append(card_to_play)

    async def play_debt_collector(self, game_state, player, target_player_id, card_id):
        print("Target player id:", target_player_id)
        card_to_play = next((c for c in player.hand if c.id == card_id), None)
        if not card_to_play:
            return
        player.hand.remove(card_to_play)
        game_state.player_ids_to_pay = [target_player_id]
        game_state.num_players_owing = 1
        game_state.total_paying_players = 1
        game_state.rent_amount = 5  # Debt Collector cards request 5M
        game_state.rent_type = "debt collector"
        game_state.rent_card = card_to_play
        game_state.rent_recipient_id = str(player.id)
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'broadcast_rent_pre_request',
                'amount': game_state.rent_amount,
                'rent_type': game_state.rent_type,
                'recipient_id': game_state.rent_recipient_id,
                'target_player_id': str(game_state.player_ids_to_pay[0]),
                'total_players': game_state.total_paying_players,
                'num_players_owing': game_state.num_players_owing,
                'card': game_state.rent_card.to_dict()
            }
        )
        game_state.discard_pile.append(card_to_play)

    async def play_double_the_rent(self, game_state, player, rent_card_id, double_the_rent_card_id, rent_amount, target_player_id=None):
        """Handle double the rent card play"""
        rent_card_to_play = next((c for c in player.hand if c.id == rent_card_id), None)
        double_the_rent_card_to_play = next((c for c in player.hand if c.id == double_the_rent_card_id), None)
        if not rent_card_to_play or not double_the_rent_card_to_play:
            return
        player.hand.remove(rent_card_to_play)
        player.hand.remove(double_the_rent_card_to_play)
        if target_player_id:
            game_state.player_ids_to_pay = [target_player_id]
        else:
            game_state.player_ids_to_pay = [p.id for p in game_state.players if p.id != player.id]
        game_state.num_players_owing = len(game_state.player_ids_to_pay)
        game_state.total_paying_players = len(game_state.player_ids_to_pay)
        game_state.rent_amount = rent_amount
        game_state.rent_type = "double_the_rent"
        game_state.rent_card = double_the_rent_card_to_play
        # game_state.double_the_rent_card = double_the_rent_card_to_play
        game_state.rent_recipient_id = str(player.id)
        # Send rent request
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'broadcast_rent_pre_request',
                'amount': game_state.rent_amount,
                'rent_type': game_state.rent_type,
                'recipient_id': game_state.rent_recipient_id,
                'target_player_id': str(game_state.player_ids_to_pay[0]),
                'total_players': game_state.total_paying_players,
                'num_players_owing': game_state.num_players_owing,
                'card': game_state.rent_card.to_dict()
            }
        )
        game_state.discard_pile.append(double_the_rent_card_to_play)
        
    async def play_multicolor_rent(self, game_state, player, card_id, rent_amount, target_player_id):
        """Handle multicolor rent card play"""
        card_to_play = next((c for c in player.hand if c.id == card_id), None)
        if not card_to_play:
            return
        player.hand.remove(card_to_play)
        game_state.player_ids_to_pay = [target_player_id]
        game_state.num_players_owing = 1
        game_state.total_paying_players = 1
        game_state.rent_amount = rent_amount
        game_state.rent_type = "multicolor rent"
        game_state.rent_card = card_to_play
        game_state.rent_recipient_id = str(player.id)
        # Send rent request
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'broadcast_rent_pre_request',
                'amount': game_state.rent_amount,
                'rent_type': game_state.rent_type,
                'recipient_id': game_state.rent_recipient_id,
                'target_player_id': str(game_state.player_ids_to_pay[0]),
                'total_players': game_state.total_paying_players,
                'num_players_owing': game_state.num_players_owing,
                'card': game_state.rent_card.to_dict()
            }
        )
        game_state.discard_pile.append(card_to_play)

    async def play_initial_rent(self, game_state, player, card, rent_amount):
        """Handle rent card play"""
        card_to_play = next((c for c in player.hand if c.id == card['id']), None)
        if not card_to_play:
            return
        player.hand.remove(card_to_play)
        # Send rent request
        game_state.player_ids_to_pay = [p.id for p in game_state.players if p.id != player.id]
        game_state.num_players_owing = len(game_state.player_ids_to_pay)
        game_state.total_paying_players = len(game_state.player_ids_to_pay)
        game_state.rent_amount = rent_amount
        game_state.rent_type = "rent"
        game_state.rent_card = card_to_play
        game_state.rent_recipient_id = str(player.id)
        await self.channel_layer.group_send(
            self.game_group_name,
            {                
                'type': 'broadcast_rent_pre_request',
                'amount': game_state.rent_amount,
                'recipient_id': game_state.rent_recipient_id,
                'target_player_id': str(game_state.player_ids_to_pay[0]),
                'total_players': game_state.total_paying_players,
                'num_players_owing': game_state.num_players_owing,
                'card': game_state.rent_card.to_dict()  # Convert card object to dictionary
            }
        )
        game_state.discard_pile.append(card_to_play)
        
    async def play_forced_deal(self, game_state, player, card_id, target_property_id, user_property_id):
        """Handle forced deal action"""
        card_to_play = next((c for c in player.hand if c.id == card_id), None)
        if not card_to_play:
            return

        # Find target player and their property
        target_player = None
        target_property = None
        target_property_color = None
        for p in game_state.players:
            if p != player:  # Don't search in the current player's properties
                for color, props in p.properties.items():
                    for prop in props:
                        if prop.id == target_property_id:
                            target_player = p
                            target_property = prop
                            target_property_color = color
                            break
                    if target_property:
                        break
                if target_property:
                    break

        if not target_player or not target_property:
            return

        # Find current player's property
        current_player = player
        user_property = None
        user_property_color = None
        for color, props in current_player.properties.items():
            for prop in props:
                if prop.id == user_property_id:
                    user_property = prop
                    user_property_color = color
                    break
            if user_property:
                break

        if not user_property:
            return

        # Define set requirements
        set_requirements = {
            'brown': 2, 'mint': 2, 'blue': 2,
            'light blue': 3, 'pink': 3, 'orange': 3, 
            'red': 3, 'yellow': 3, 'green': 3,
            'black': 4
        }

        # Handle houses and hotels for current player's property
        user_color_cards = current_player.properties.get(user_property_color, [])
        if user_color_cards:
            # Separate cards by type
            property_cards = [card for card in user_color_cards if card.card_type.lower() == 'property']
            house_cards = [card for card in user_color_cards if card.card_type.lower() == 'action' and card.name.lower() == 'house']
            hotel_cards = [card for card in user_color_cards if card.card_type.lower() == 'action' and card.name.lower() == 'hotel']
            
            required_cards = set_requirements.get(user_property_color, 0)
            if len(property_cards) == 2 * required_cards:
                if len(house_cards) > 1:
                    current_player.properties[user_property_color].remove(house_cards[0])
                    current_player.bank.append(house_cards[0])
                if len(hotel_cards) > 1:
                    current_player.properties[user_property_color].remove(hotel_cards[0])
                    current_player.bank.append(hotel_cards[0])
            elif len(property_cards) == required_cards:
                if house_cards:
                    current_player.properties[user_property_color].remove(house_cards[0])
                    current_player.bank.append(house_cards[0])
                if hotel_cards:
                    current_player.properties[user_property_color].remove(hotel_cards[0])
                    current_player.bank.append(hotel_cards[0])

        # Remove properties from their current sets
        for color, props in target_player.properties.items():
            if target_property in props:
                props.remove(target_property)
                if not props:  # Remove empty color sets
                    del target_player.properties[color]
                break

        for color, props in current_player.properties.items():
            if user_property in props:
                props.remove(user_property)
                if not props:  # Remove empty color sets
                    del current_player.properties[color]
                break

        # Add properties to their new owners
        if target_property_color not in current_player.properties:
            current_player.properties[target_property_color] = []
        current_player.properties[target_property_color].append(target_property)

        if user_property_color not in target_player.properties:
            target_player.properties[user_property_color] = []
        target_player.properties[user_property_color].append(user_property)

        # Remove the forced deal card from player's hand
        current_player.hand.remove(card_to_play)
        game_state.discard_pile.append(card_to_play)

        # Broadcast the property swap animation
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'broadcast_property_swap',
                'property1': target_property.to_dict(),
                'property2': user_property.to_dict(),
                'player1_id': player.id,
                'player2_id': target_player.id,
                'player1_name': player.name,
                'player2_name': target_player.name
            }
        )

    async def play_deal_breaker(self, game_state, player, card_id, target_set, target_color):
        """Handle deal breaker action"""
        card_to_play = next((c for c in player.hand if c.id == card_id), None)
        if not card_to_play:
            return
        
        # Find the target player who owns the set
        target_player = None
        for p in game_state.players:
            if p != player and target_color in p.properties:
                # Check if the target set matches the player's properties
                target_card_ids = {card['id'] for card in target_set}
                player_card_ids = {card.id for card in p.properties[target_color]}
                if target_card_ids.issubset(player_card_ids):
                    target_player = p
                    break
        
        if target_player:
            # First, get all the cards we want to transfer
            cards_to_transfer = [
                card for card in target_player.properties[target_color]
                if card.id in {c['id'] for c in target_set}
            ]
            
            # Add the cards to the current player's properties
            if target_color not in player.properties:
                player.properties[target_color] = []
            player.properties[target_color].extend(cards_to_transfer)
            
            # Remove the cards from the target player
            target_player.properties[target_color] = [
                card for card in target_player.properties[target_color]
                if card.id not in {c['id'] for c in target_set}
            ]
            
            # If no cards left in that color, remove the color entry
            if not target_player.properties[target_color]:
                del target_player.properties[target_color]
            
            # Remove the deal breaker card from hand and add to discard pile
            player.hand.remove(card_to_play)
            game_state.discard_pile.append(card_to_play)
            
            # Send deal breaker overlay
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'broadcast_deal_breaker_overlay',
                    'stealerId': player.id,
                    'targetId': target_player.id,
                    'color': target_color,
                    'property_set': [card.to_dict() for card in cards_to_transfer]
                }
            )

    async def play_sly_deal(self, game_state, player, card_id, target_property_id):
        """Handle sly deal action"""
        card_to_play = next((c for c in player.hand if c.id == card_id), None)
        if not card_to_play:
            return
        
        stolen_property = None
        property_color = None
        target_player = None
        for p in game_state.players:
            if p != player:  # Don't search in the current player's properties
                for color, properties in p.properties.items():
                    for prop in properties:
                        if prop.id == target_property_id:
                            stolen_property = prop
                            property_color = color
                            target_player = p
                            break
                    if stolen_property:
                        break
                if stolen_property:
                    break

        if stolen_property and target_player:
            target_player.properties[property_color].remove(stolen_property)
            if not target_player.properties[property_color]:
                del target_player.properties[property_color]
            if property_color not in player.properties:
                player.properties[property_color] = []
            player.properties[property_color].append(stolen_property)
            player.hand.remove(card_to_play)
            game_state.discard_pile.append(card_to_play)
            # Send notification about the sly deal
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'broadcast_property_stolen',
                    'player_id': str(player.id),
                    'target_id': str(target_player.id),
                    'player_name': player.name,
                    'target_name': target_player.name,
                    'property': stolen_property.to_dict()
                }
            )

    def assist_rent_payment(self, game_state, player_id, recipient_id, card):
        # Get the paying player and receiving player
        paying_player = next(p for p in game_state.players if str(p.id) == player_id)
        receiving_player = next(p for p in game_state.players if str(p.id) == recipient_id)
        selected_cards = card.get('selected_cards', [])
        
        # Keep track of transferred cards with full info
        transferred_cards = []
        
        # Find and transfer each selected card
        for card_id in selected_cards:
            # First try to find in bank
            card_found = None
            for bank_card in paying_player.bank[:]:  # Create a copy to safely modify during iteration
                if bank_card.id == card_id:
                    card_found = bank_card
                    paying_player.bank.remove(card_found)
                    receiving_player.bank.append(card_found)
                    transferred_cards.append(card_found.to_dict())  # Add full card info
                    break
            
            # If not in bank, search in properties
            if not card_found:
                # Create a list to store colors that need to be removed after iteration
                colors_to_remove = []
                
                # Make a copy of the properties dictionary keys to safely iterate
                for color in list(paying_player.properties.keys()):
                    props = paying_player.properties[color]
                    for prop in props[:]:  # Create a copy to safely modify during iteration
                        if prop.id == card_id:
                            card_found = prop
                            paying_player.properties[color].remove(card_found)
                            
                            # Check if it's a house or hotel
                            if card_found.name.lower() == 'house':
                                for card in paying_player.properties[card_found.current_color]:
                                    if card.name.lower() == 'hotel':
                                        paying_player.properties[card_found.current_color].remove(card)
                                        paying_player.bank.append(card)
                                        break
                                receiving_player.bank.append(card_found)
                                transferred_cards.append(card_found.to_dict())  # Add full card info
                            elif card_found.name.lower() == 'hotel':
                                receiving_player.bank.append(card_found)
                                transferred_cards.append(card_found.to_dict())  # Add full card info
                            else:
                                # Regular property card
                                if card_found.current_color not in receiving_player.properties:
                                    receiving_player.properties[card_found.current_color] = []
                                
                                # Get all cards of this color
                                color_cards = paying_player.properties[card_found.current_color]
                                
                                # Define set requirements
                                set_requirements = {
                                    'brown': 2, 'mint': 2, 'blue': 2,
                                    'light blue': 3, 'pink': 3, 'orange': 3, 
                                    'red': 3, 'yellow': 3, 'green': 3,
                                    'black': 4
                                }
                                
                                # Get required cards for this color
                                required_cards = set_requirements.get(card_found.current_color, 0)
                                
                                # Separate cards by type
                                property_cards = [card for card in color_cards if card.card_type.lower() == 'property']
                                house_cards = [card for card in color_cards if card.card_type.lower() == 'action' and card.name.lower() == 'house']
                                hotel_cards = [card for card in color_cards if card.card_type.lower() == 'action' and card.name.lower() == 'hotel']
                                
                                if len(property_cards) + 1 == 2 * required_cards:
                                    if len(house_cards) > 1:
                                        paying_player.properties[card_found.current_color].remove(house_cards[0])
                                        paying_player.bank.append(house_cards[0])
                                    if len(hotel_cards) > 1:
                                        paying_player.properties[card_found.current_color].remove(hotel_cards[0])
                                        paying_player.bank.append(hotel_cards[0])
                                elif len(property_cards) + 1 == required_cards:
                                    if house_cards:
                                        paying_player.properties[card_found.current_color].remove(house_cards[0])
                                        paying_player.bank.append(house_cards[0])
                                    if hotel_cards:
                                        paying_player.properties[card_found.current_color].remove(hotel_cards[0])
                                        paying_player.bank.append(hotel_cards[0])
                                
                                receiving_player.properties[card_found.current_color].append(card_found)
                                transferred_cards.append(card_found.to_dict())  # Add full card info
                            
                            # Mark this color for removal if it's empty
                            if not paying_player.properties[color]:
                                colors_to_remove.append(color)
                            break
                    if card_found:
                        break
                
                # Remove empty color sets after iteration is complete
                for color in colors_to_remove:
                    if color in paying_player.properties and not paying_player.properties[color]:
                        del paying_player.properties[color]
        
        return transferred_cards  # Return the list of transferred cards with full info
    
    async def play_just_say_no_choice(self, data):
        player_id = data.get('playerId')
        opponent_id = data.get('opponentId')
        card = data.get('card')
        action = data.get('action')
        against_card = data.get('againstCard') or None
        against_rent_card = data.get('againstRentCard') or None
        original_action_data = json.loads(data.get('data'))
        game_state = GameConsumer.game_instances[self.room_id]
        if against_card['name'].lower() != 'it\'s your birthday' and against_card['name'].lower() != 'rent' and against_card['name'].lower() != 'double the rent' and against_card['name'].lower() != 'multicolor rent' and against_card['name'].lower() != 'debt collector':
            # Display original action played notification
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'broadcast_card_played',
                    'player_id': original_action_data['player'],
                    'action': original_action_data['action'],
                    'action_type': 'to_bank' if original_action_data['action'] == 'to_bank' else 'to_properties' if original_action_data['action'] == 'to_properties' else 'action',
                    'card': original_action_data['card']
                }
            )
        # Let everyone know player is making a choice to use just say no or not
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'broadcast_just_say_no_choice',
                'opponentId': opponent_id,
                'playerId': player_id,
                'card': card,
                'againstCard': against_card,
                'againstRentCard': against_rent_card,
                'data': original_action_data
            }
        )
        
    async def play_just_say_no_response(self, data):
        play_just_say_no = data.get('playJustSayNo')
        player_id = data.get('playerId')
        opponent_id = data.get('opponentId')
        card = data.get('card')
        action = data.get('action')
        against_card = data.get('againstCard')
        against_rent_card = data.get('againstRentCard') or None
        original_action_data = json.loads(data.get('data'))
        game_state = GameConsumer.game_instances[self.room_id]
        if not play_just_say_no:
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'broadcast_just_say_no_response',
                    'playJustSayNo': play_just_say_no,
                    'playerId': player_id,
                    'opponentId': opponent_id,
                    'card': card,
                    'againstCard': against_card,
                    'againstRentCard': against_rent_card,
                    'data': original_action_data
                }
            )
            # Proceed as usual
            if original_action_data['action'] == 'rent_request':
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'broadcast_rent_request',
                        'amount': game_state.rent_amount,
                        'rent_type': game_state.rent_type,
                        'recipient_id': game_state.rent_recipient_id,
                        'target_player_id': str(game_state.player_ids_to_pay[0]),
                        'total_players': game_state.total_paying_players,
                        'num_players_owing': game_state.num_players_owing
                    }
                )
            else:
                await self.handle_action_with_notification(original_action_data, original_action_data['action'], original_action_data['card'], original_action_data['player'])
                self.manage_turns(game_state)
            await self.send_game_state()
        else:
            player_obj = next(p for p in game_state.players if p.id == player_id)
            opponent_obj = next(p for p in game_state.players if p.id == opponent_id)
            if against_card['name'].lower() != 'it\'s your birthday' and against_card['name'].lower() != 'rent' and against_card['name'].lower() != 'double the rent' and against_card['name'].lower() != 'multicolor rent' and against_card['name'].lower() != 'debt collector':
                against_card_obj = next(c for c in opponent_obj.hand if c.id == against_card['id'])
                opponent_obj.hand.remove(against_card_obj)
            if against_rent_card:
                against_rent_card_obj = next(c for c in opponent_obj.hand if c.id == against_rent_card['id'])
                opponent_obj.hand.remove(against_rent_card_obj)
            card_obj = next(c for c in player_obj.hand if c.id == card['id'])
            player_obj.hand.remove(card_obj)
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'broadcast_card_played',
                    'player_id': player_id,
                    'action': action,
                    'action_type': 'to_bank' if action == 'to_bank' else 'to_properties' if action == 'to_properties' else 'action',
                    'card': card
                }
            )
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'broadcast_just_say_no_response',
                    'playJustSayNo': play_just_say_no,
                    'playerId': player_id,
                    'opponentId': opponent_id,
                    'card': card,
                    'againstCard': against_card,
                    'againstRentCard': against_rent_card,
                    'data': original_action_data
                }
            )
            
            game_state.discard_pile.append(card_obj)
            # recipient_id = original_action_data.get('player')
            if not (against_card['name'].lower() != 'it\'s your birthday' and against_card['name'].lower() != 'rent' and against_card['name'].lower() != 'double the rent' and against_card['name'].lower() != 'multicolor rent' and against_card['name'].lower() != 'debt collector'):
                game_state.player_ids_to_pay.pop(0)
                game_state.num_players_owing -= 1
                if game_state.num_players_owing > 0:
                    await self.channel_layer.group_send(
                        self.game_group_name,
                        {
                            'type': 'broadcast_rent_pre_request',
                            'amount': game_state.rent_amount,
                            # 'recipient_id': recipient_id,
                            'recipient_id': game_state.rent_recipient_id,
                            'target_player_id': str(game_state.player_ids_to_pay[0]),
                            'total_players': game_state.total_paying_players,
                            'num_players_owing': game_state.num_players_owing,
                            'card': against_card
                        }
                    )
                else:
                    game_state.player_ids_to_pay = []
                    game_state.num_players_owing = 0
                    game_state.rent_amount = 0
                    game_state.total_paying_players = 0
            else:
                self.manage_turns(game_state)
            if against_rent_card:
                self.manage_turns(game_state)  # The additional turn is handled here
            await self.send_game_state()

    async def play_rent_request(self, data):
        card = data.get('card')
        player_id = data.get('player')
        action = data.get('action')
        game_state = GameConsumer.game_instances[self.room_id]
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'broadcast_rent_request',
                'amount': game_state.rent_amount,
                'rent_type': game_state.rent_type,
                'recipient_id': game_state.rent_recipient_id,
                'target_player_id': str(game_state.player_ids_to_pay[0]),
                'total_players': game_state.total_paying_players,
                'num_players_owing': game_state.num_players_owing
            }
        )

    async def play_rent_payment(self, data):
        card = data.get('card')
        player_id = data.get('player')
        action = data.get('action')
        game_state = GameConsumer.game_instances[self.room_id]
        transferred_cards = self.assist_rent_payment(game_state, player_id, game_state.rent_recipient_id, card)
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'broadcast_rent_paid',
                'recipient_id': game_state.rent_recipient_id,
                'player_id': player_id,
                'selected_cards': transferred_cards,  
            }
        )
        await self.send_game_state()

    async def play_rent_paid(self, data):
        card = data.get('card')
        player_id = data.get('player')
        action = data.get('action')
        game_state = GameConsumer.game_instances[self.room_id]
        game_state.player_ids_to_pay.pop(0)
        game_state.num_players_owing -= 1
        if game_state.num_players_owing > 0:
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'broadcast_rent_pre_request',
                    'amount': game_state.rent_amount,
                    'recipient_id': game_state.rent_recipient_id,
                    'target_player_id': str(game_state.player_ids_to_pay[0]),
                    'total_players': game_state.total_paying_players,
                    'num_players_owing': game_state.num_players_owing,
                    'card': game_state.rent_card.to_dict()
                }
            )
        else:
            game_state.player_ids_to_pay = []
            game_state.num_players_owing = 0
            game_state.rent_amount = 0
            game_state.total_paying_players = 0
            game_state.rent_type = None
            game_state.rent_card = None

    def manage_turns(self, game_state):
        # Check if current player has won
        current_player = game_state.players[game_state.turn_index]
        if current_player.has_won():
            print(f"{current_player.name} WON!")
            game_state.winner = current_player

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


    ########## SENDS - CALLING BROADCASTS ##########

    # Track previous game state to compute diffs
    previous_game_states = {}
    
    async def send_game_state(self, full_state=False):
        """
        Broadcast the current game state to all clients in the group.
        If full_state is True, send the entire state, otherwise send only the changes.
        """
        game_state = self.game_instances.get(self.room_id)
        if game_state:
            current_state = game_state.to_dict()
            if hasattr(game_state, 'last_action'):
                current_state['last_action'] = game_state.last_action
                # Clear the last action after broadcasting
                game_state.last_action = None
            
            # If this is the first update or full_state is requested, send the entire state
            if full_state or self.room_id not in self.previous_game_states:
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'broadcast_game_update',
                        'state': current_state,
                        'is_full_state': True
                    }
                )
                # Store the current state for future diffs
                self.previous_game_states[self.room_id] = current_state
                return
            
            # Calculate the diff between previous and current state
            previous_state = self.previous_game_states[self.room_id]
            state_diff = self.calculate_state_diff(previous_state, current_state)
            
            # Send only the diff if it's not empty
            if state_diff:
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'broadcast_game_update',
                        'state': state_diff,
                        'is_full_state': False
                    }
                )
            
            # Update the previous state
            self.previous_game_states[self.room_id] = current_state

    async def send_room_update(self):
        """
        Broadcast the updated room state to all clients in the group.
        """
        print(await self.db_get_room_data_by_id(self.room_id))
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'broadcast_room_update',
                'data': await self.db_get_room_data_by_id(self.room_id)
            }
        )


    ########## BROADCASTS - FINAL MESSAGE SEND VIA SOCKET ##########
    
    async def broadcast_just_say_no_response(self, event):
        await self.send(text_data=json.dumps({
            'type': 'just_say_no_response',
            'playJustSayNo': event['playJustSayNo'],
            'playerId': event['playerId'],
            'opponentId': event['opponentId'],
            'card': event['card'],
            'againstCard': event['againstCard'],
            'againstRentCard': event['againstRentCard'],
            'data': event['data']
        }))
    
    async def broadcast_just_say_no_choice(self, event):
        await self.send(text_data=json.dumps({
            'type': 'just_say_no_choice',
            'opponentId': event['opponentId'],
            'playerId': event['playerId'],
            'card': event['card'],
            'againstCard': event['againstCard'],
            'againstRentCard': event['againstRentCard'],
            'data': event['data']
        }))

    async def broadcast_game_started(self, event):
        # This method will be called when a game has started
        await self.send(text_data=json.dumps({
            'type': 'broadcast_game_started',
            'message': event.get('message', 'The game has started!'),
        }))

    async def broadcast_game_update(self, event):
        """
        Send game state update to WebSocket.
        """
        await self.send(text_data=json.dumps({
            'type': 'game_update',
            'state': event['state'],
            'is_full_state': event.get('is_full_state', True)
        }))

    async def broadcast_card_played(self, event):
        """
        Broadcast a card played event to all clients in the group.
        """
        await self.send(text_data=json.dumps({
            'type': 'card_played',
            'player_id': event['player_id'],
            'action': event['action'],
            'action_type': event['action_type'],
            'card': event['card']
        }))
        
    async def broadcast_rent_pre_request(self, event):
        try:
            await self.send(text_data=json.dumps({
                'type': 'rent_pre_request',
                'amount': event['amount'],
                'recipient_id': event['recipient_id'],
                'target_player_id': event.get('target_player_id', None),
                'total_players': event.get('total_players', None),
                'num_players_owing': event.get('num_players_owing', None),
                'card': event['card']
            }))
        except Exception as e:
            print(f"Error in broadcast_rent_pre_request: {e}")

    async def broadcast_rent_request(self, event):
        try:
            await self.send(text_data=json.dumps({
                'type': 'rent_request',
                'amount': event['amount'],
                'rent_type': event['rent_type'],
                'recipient_id': event['recipient_id'],
                'target_player_id': event.get('target_player_id', None),
                'total_players': event.get('total_players', None),
                'num_players_owing': event.get('num_players_owing', None)
            }))
        except Exception as e:
            print(f"Error in broadcast_rent_request: {e}")

    async def broadcast_rent_paid(self, event):
        """Notify players that rent has been paid"""
        await self.send(text_data=json.dumps({
            'type': 'rent_paid',
            'recipient_id': event['recipient_id'],
            'player_id': event['player_id'],
            'selected_cards': event['selected_cards'],
        }))

    async def broadcast_room_update(self, event):
        """
        Send room state update to WebSocket.
        """
        await self.send(text_data=json.dumps(event['data']))

    async def broadcast_property_stolen(self, event):
        """Notify players that a property has been stolen"""
        await self.send(text_data=json.dumps({
            'type': 'property_stolen',
            'player_id': event['player_id'],
            'target_id': event['target_id'],
            'player_name': event['player_name'],
            'target_name': event['target_name'],
            'property': event['property']
        }))

    async def broadcast_property_swap(self, event):
        """Send property swap animation data to the client"""
        await self.send(text_data=json.dumps({
            'type': 'property_swap',
            'property1': event['property1'],
            'property2': event['property2'],
            'player1_id': event['player1_id'],
            'player2_id': event['player2_id'],
            'player1_name': event['player1_name'],
            'player2_name': event['player2_name']
        }))

    async def broadcast_deal_breaker_overlay(self, event):
        """Send deal breaker overlay data to the client"""
        await self.send(text_data=json.dumps({
            'type': 'deal_breaker_overlay',
            'stealerId': event['stealerId'],
            'targetId': event['targetId'],
            'color': event['color'],
            'property_set': event['property_set']
        }))

    async def broadcast_player_disconnected(self, event):
        """Notify players that another player has disconnected"""
        await self.send(text_data=json.dumps({
            'type': 'player_disconnected',
            'player_id': event['player_id'],
            'username': event['username']
        }))


    ########## DATABASE FETCHES AND UPDATES ##########

    @database_sync_to_async
    def db_mark_game_start(self, room):
        """
        Mark the game as started and update the database.
        """
        room.has_started = True
        room.save()

    @database_sync_to_async
    def db_get_room_by_id(self, room_id):
        """
        Retrieve a game room by its ID.
        """
        from backend.game.models import GameRoom
        try:
            return GameRoom.objects.get(room_id=room_id)
        except GameRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def db_get_room_data_by_id(self, room_id):
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
    def db_get_user_by_unique_id(self, unique_id):
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
    def db_add_player_to_room(self, room, user):
        """
        Add a player to the room and update the database.
        """
        room.players.append({'id': str(user.unique_id), 'name': user.username, 'isReady': False})
        room.player_count += 1
        room.save()

    @database_sync_to_async
    def db_remove_player_from_room(self, player_id):
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
    def db_set_player_ready(self, readiness):
        from backend.game.models import GameRoom
        try:
            room = GameRoom.objects.get(room_id=self.room_id)
            for player in room.players:
                if player['id'] == self.player_id:
                    player['isReady'] = readiness
                    room.save()
        except GameRoom.DoesNotExist:
            pass
