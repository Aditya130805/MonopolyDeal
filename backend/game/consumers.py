from channels.generic.websocket import AsyncWebsocketConsumer
import json
from backend.game_core.game import Game
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
        elif action == 'initial_game_state':
            await self.send_game_state()
        elif action == 'skip_turn':
            game_state = GameConsumer.game_instances[self.room_id]
            player_id = data.get('player')
            if player_id == str(game_state.players[game_state.turn_index].id):
                game_state.actions_remaining = 1  # This will trigger the turn switch in manage_turns
                self.manage_turns(game_state)  # This will switch turns
                await self.send_game_state()
        
        ###### GAME ACTIONS ######
        elif action == 'just_say_no_choice':
            playing_player = data.get('playing_player')
            against_player = data.get('against_player')
            card = data.get('card')
            against_card = data.get('against_card')
            against_rent_card = data.get('against_rent_card') or None
            playing_player_name = data.get('playing_player_name')
            against_player_name = data.get('against_player_name')
            real_action_data = json.loads(data.get('data'))
            game_state = GameConsumer.game_instances[self.room_id]
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'broadcast_card_played',
                    'player_id': real_action_data['player'],
                    'action': real_action_data['action'],
                    'action_type': 'to_bank' if real_action_data['action'] == 'to_bank' else 'to_properties' if real_action_data['action'] == 'to_properties' else 'action',
                    'card': real_action_data['card']
                }
            )
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'broadcast_just_say_no_choice',
                    'against_player': against_player,
                    'playing_player': playing_player,
                    'card': card,
                    'against_card': against_card,
                    'against_rent_card': against_rent_card,
                    'playing_player_name': playing_player_name,
                    'against_player_name': against_player_name,
                    'data': real_action_data
                }
            )
        elif action == 'just_say_no_response':
            play_just_say_no = data.get('play_just_say_no')
            playing_player = data.get('playing_player')
            against_player = data.get('against_player')
            playing_player_name = data.get('playing_player_name')
            against_player_name = data.get('against_player_name')
            card = data.get('card')
            against_card = data.get('against_card')
            against_rent_card = data.get('against_rent_card') or None
            real_action_data = json.loads(data.get('data'))
            game_state = GameConsumer.game_instances[self.room_id]
            if not play_just_say_no:
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'broadcast_just_say_no_response',
                        'play_just_say_no': play_just_say_no,
                        'playing_player': playing_player,
                        'against_player': against_player,
                        'playing_player_name': playing_player_name,
                        'against_player_name': against_player_name,
                        'card': card,
                        'against_card': against_card,
                        'against_rent_card': against_rent_card,
                        'data': real_action_data
                    }
                )
                # Proceed as usual
                await self.handle_action_with_notification(real_action_data, real_action_data['action'], real_action_data['card'], real_action_data['player'])
                self.manage_turns(game_state)
                await self.send_game_state()
            else:
                game_state = GameConsumer.game_instances[self.room_id]
                against_player_object = next(player for player in game_state.players if player.id == against_player)
                playing_player_object = next(player for player in game_state.players if player.id == playing_player)
                against_card_to_remove = next(c for c in against_player_object.hand if c.id == against_card['id'])
                if against_rent_card:
                    against_card_to_remove_2 = next(c for c in against_player_object.hand if c.id == against_rent_card['id'])
                    against_player_object.hand.remove(against_card_to_remove_2)
                playing_player_card = next(c for c in playing_player_object.hand if c.id == card['id'])
                against_player_object.hand.remove(against_card_to_remove)
                playing_player_object.hand.remove(playing_player_card)
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'broadcast_card_played',
                        'player_id': playing_player,
                        'action': action,
                        'action_type': 'to_bank' if action == 'to_bank' else 'to_properties' if action == 'to_properties' else 'action',
                        'card': card
                    }
                )
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'broadcast_just_say_no_response',
                        'play_just_say_no': play_just_say_no,
                        'playing_player': playing_player,
                        'against_player': against_player,
                        'playing_player_name': playing_player_name,
                        'against_player_name': against_player_name,
                        'card': card,
                        'against_card': against_card,
                        'against_rent_card': against_rent_card,
                        'data': real_action_data
                    }
                )
                game_state.discard_pile.append(playing_player_card)
                self.manage_turns(game_state)
                if against_rent_card:
                    self.manage_turns(game_state)  # The additional turn is handled here
                await self.send_game_state()
        else:
            card = data.get('card')
            player_id = data.get('player')
            game_state = GameConsumer.game_instances[self.room_id]
            if action == 'rent_payment':
                recipient_id = data.get('recipient_id')
                transferred_cards = self.assist_rent_payment(game_state, player_id, recipient_id, card)
                paying_player = next((p for p in game_state.players if str(p.id) == player_id), None)
                receiving_player = next((p for p in game_state.players if str(p.id) == recipient_id), None)
                
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'broadcast_rent_paid',
                        'recipient_id': recipient_id,
                        'player_id': player_id,
                        'selected_cards': transferred_cards,  
                        'player_name': paying_player.name,
                        'recipient_name': receiving_player.name
                    }
                )
                # self.manage_turns(game_state)
                await self.send_game_state()
            else:
                await self.handle_action_with_notification(data, action, card, player_id)
                self.manage_turns(game_state)
                await self.send_game_state()

    async def handle_action_with_notification(self, data, action, card, player_id):
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
            await self.play_debt_collector(game_state, player, card['id'])
            
        elif action == 'rent':
            await self.play_rent(game_state, player, card, data.get('rentAmount'))
            
        elif action == 'sly_deal':
            await self.play_sly_deal(game_state, player, card['id'], data.get('target_property'))
            
        elif action == 'forced_deal':
            await self.play_forced_deal(game_state, player, card['id'], data.get('target_property'), data.get('user_property'))
            
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
            await self.play_double_the_rent(game_state, player, card['id'], data.get('double_the_rent_card')['id'], data.get('rentAmount'))
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
        if card_to_play:
            player.hand.remove(card_to_play)
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'broadcast_rent_request',
                    'amount': 2,  # It's Your Birthday cards request 2M
                    'rent_type': "it's your birthday",
                    'recipient_id': player.id
                }
            )
            game_state.discard_pile.append(card_to_play)
    
    async def play_debt_collector(self, game_state, player, card_id):
        card_to_play = next((c for c in player.hand if c.id == card_id), None)
        if card_to_play:
            player.hand.remove(card_to_play)
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'broadcast_rent_request',
                    'amount': 5,  # Debt Collector cards request 5M
                    'rent_type': "debt collector",
                    'recipient_id': player.id
                }
            )
            game_state.discard_pile.append(card_to_play)
    
    async def play_double_the_rent(self, game_state, player, rent_card_id, double_the_rent_card_id, rent_amount):
        """Handle double the rent card play"""
        rent_card_to_play = next((c for c in player.hand if c.id == rent_card_id), None)
        double_the_rent_card_to_play = next((c for c in player.hand if c.id == double_the_rent_card_id), None)
        if not rent_card_to_play or not double_the_rent_card_to_play:
            return
        player.hand.remove(rent_card_to_play)
        player.hand.remove(double_the_rent_card_to_play)
        opponent = next((p for p in game_state.players if p.id != player.id), None)
        # Send rent request
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'broadcast_rent_request',
                'player_id': str(opponent.id),
                'amount': rent_amount,
                'rent_type': "double_the_rent",
                'recipient_id': str(player.id)
            }
        )
        game_state.discard_pile.append(rent_card_to_play)
        game_state.discard_pile.append(double_the_rent_card_to_play)
    
    async def play_rent(self, game_state, player, card, rent_amount):
        """Handle rent card play"""
        card_to_play = next((c for c in player.hand if c.id == card['id']), None)
        if not card_to_play:
            return
        player.hand.remove(card_to_play)
        opponent = next((p for p in game_state.players if p.id != player.id), None)
        # Send rent request
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'broadcast_rent_request',
                'player_id': str(opponent.id),
                'amount': rent_amount,
                'rent_type': "rent",
                'recipient_id': str(player.id)
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
                    'player_name': player.name,
                    'target_name': target_player.name,
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
                for color, props in paying_player.properties.items():
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
                            # Remove color key if no properties left
                            if not paying_player.properties[color]:
                                del paying_player.properties[color]
                            break
                    if card_found:
                            break
        
        return transferred_cards  # Return the list of transferred cards with full info

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

    async def send_game_state(self):
        """
        Broadcast the current game state to all clients in the group.
        """
        game_state = self.game_instances.get(self.room_id)
        if game_state:
            state = game_state.to_dict()
            if hasattr(game_state, 'last_action'):
                state['last_action'] = game_state.last_action
                # Clear the last action after broadcasting
                game_state.last_action = None
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'broadcast_game_update',
                    'state': state
                }
            )

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
            'play_just_say_no': event['play_just_say_no'],
            'playing_player': event['playing_player'],
            'against_player': event['against_player'],
            'playing_player_name': event['playing_player_name'],
            'against_player_name': event['against_player_name'],
            'card': event['card'],
            'against_card': event['against_card'],
            'against_rent_card': event['against_rent_card'],
            'data': event['data']
        }))
    
    async def broadcast_just_say_no_choice(self, event):
        await self.send(text_data=json.dumps({
            'type': 'just_say_no_choice',
            'against_player': event['against_player'],
            'playing_player': event['playing_player'],
            'card': event['card'],
            'against_card': event['against_card'],
            'against_rent_card': event['against_rent_card'],
            'playing_player_name': event['playing_player_name'],
            'against_player_name': event['against_player_name'],
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
            'state': event['state']
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

    async def broadcast_rent_request(self, event):
        try:
            await self.send(text_data=json.dumps({
                'type': 'rent_request',
                'amount': event['amount'],
                'rent_type': event['rent_type'],
                'recipient_id': event['recipient_id']
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
            'player_name': event['player_name'],
            'recipient_name': event['recipient_name']
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
            'player_name': event['player_name'],
            'target_name': event['target_name'],
            'color': event['color'],
            'property_set': event['property_set']
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
