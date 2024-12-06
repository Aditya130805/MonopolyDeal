from channels.generic.websocket import AsyncWebsocketConsumer
import json
from game.game import Game
from channels.db import database_sync_to_async
import asyncio

class GameConsumer(AsyncWebsocketConsumer):
    
    game_instance = None   # Shared across WebSocket connections for simplicity
    room_connections = {}  # Track connections per room
    
    async def connect(self):
        """
        This method is called when a WebSocket connection is established (when a player connects to the game).
        """
        # Get room_id from URL parameters
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.game_group_name = f'game_{self.room_id}'
        
        # Initialize room connections counter if not exists
        if self.room_id not in GameConsumer.room_connections:
            GameConsumer.room_connections[self.room_id] = 0
        
        print(f"Current connections for room {self.room_id}: {GameConsumer.room_connections[self.room_id]}")
        
        if GameConsumer.room_connections[self.room_id] >= 4:
            self.connection_rejected = True  # Mark this connection as rejected
            print(f"Room {self.room_id} is full, rejecting connection")
            await self.accept()  # Accept the connection
            await self.send(text_data=json.dumps({
                'type': 'rejection',
                'data': 'Room is full'
            }))  # Send message to redirect to home page
            await self.close()  # Close the connection
            return
            
        self.connection_rejected = False  # Mark as valid connection
        # Increment connections for this room
        GameConsumer.room_connections[self.room_id] += 1
        
        # Add player to game group
        await self.channel_layer.group_add(
            self.game_group_name,
            self.channel_name
        )
        
        await self.accept()  # Accept the connection first
        
        # Get current room state
        room_state = await self.get_room_state()
        
        # Only increment player count if we have more connections than players
        if GameConsumer.room_connections[self.room_id] > room_state['player_count']:
            await self.increment_player_count()
        
        # Broadcast updated state to ALL clients in the group
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'room_update',
                'data': await self.get_room_state()
            }
        )

    async def disconnect(self, close_code):
        """
        This method is called when a player disconnects (closes their WebSocket connection).
        """
        if not hasattr(self, 'room_id'):
            return  # Connection was never fully established
            
        # Check if this was a rejected connection
        if hasattr(self, 'connection_rejected') and self.connection_rejected:
            print("REJECTED!")
            return  # Don't modify game state for rejected connections
            
        # Decrement connections for this room
        print("ENTERED!")
        if self.room_id in GameConsumer.room_connections:
            GameConsumer.room_connections[self.room_id] -= 1
            if GameConsumer.room_connections[self.room_id] <= 0:
                del GameConsumer.room_connections[self.room_id]
        
        # Only update game state if connection was accepted
        await self.decrement_player_count()
        
        # Remove from game group
        await self.channel_layer.group_discard(
            self.game_group_name,
            self.channel_name
        )
        
        # Broadcast updated state to remaining players
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'room_update',
                'data': await self.get_room_state()
            }
        )

    @database_sync_to_async
    def increment_player_count(self):
        from backend.game.models import GameRoom
        try:
            room = GameRoom.objects.get(room_id=self.room_id)
            room.player_count += 1
            room.save()
            return room.player_count
        except GameRoom.DoesNotExist:
            pass

    @database_sync_to_async
    def decrement_player_count(self):
        from backend.game.models import GameRoom
        try:
            room = GameRoom.objects.get(room_id=self.room_id)
            if room.player_count > 0:
                room.player_count -= 1
                room.save()
        except GameRoom.DoesNotExist:
            pass

    @database_sync_to_async
    def get_room_state(self):
        """Get the current room state including players"""
        from backend.game.models import GameRoom
        try:
            room = GameRoom.objects.get(room_id=self.room_id)
            return {
                'players': [
                    {
                        'id': i + 1,
                        'name': f'Player {i + 1}',
                        'isReady': False
                    } for i in range(room.player_count)
                ],
                'player_count': room.player_count,
                'max_players': room.max_players
            }
        except GameRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def get_max_players(self):
        """Get the maximum number of players allowed in the room"""
        from backend.game.models import GameRoom
        try:
            room = GameRoom.objects.get(room_id=self.room_id)
            return room.max_players
        except GameRoom.DoesNotExist:
            return None

    async def room_update(self, event):
        """
        Sends room update to WebSocket
        """
        await self.send(text_data=json.dumps(event['data']))

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'start_game':
            player_name = data.get('player_name', 'Player1')
            self.game_instance = Game([player_name])
            await self.broadcast_game_state()
        elif action == 'player_ready':
            # Handle player ready state
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'room_update',
                    'data': await self.get_room_state()
                }
            )
        
    async def broadcast_game_state(self):
        if self.game_instance:
            state = self.game_instance.to_dict()
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'game_update',
                    'state': state
                }
            )
            
    async def game_update(self, event):
        state = event['state']
        await self.send(text_data=json.dumps(state))
