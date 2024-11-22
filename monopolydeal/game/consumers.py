from channels.generic.websocket import AsyncWebsocketConsumer
import json
from game.game import Game

class GameConsumer(AsyncWebsocketConsumer):
    
    game_instance = None   # Shared across WebSocket connections for simplicity
    
    async def connect(self):
        """
        This method is called when a WebSocket connection is established (when a player connects to the game).
        """
        # Add player to a game group
        self.game_group_name = 'monopolydeal_game'
        await self.channel_layer.group_add(
            self.game_group_name,
            self.channel_name
        )  # Adds the WebSocket connection (self.channel_name) to the game group (self.game_group_name). The game group is a way to broadcast messages to all players in the game (so everyone in the group will receive the same messages).
        await self.accept()  # Accepts the WebSocket connection, meaning the server is ready to communicate with the client (the player).

    async def disconnect(self, close_code):
        """
        This method is called when a player disconnects (closes their WebSocket connection).
        """
        # Remove player from the game group
        await self.channel_layer.group_discard(
            self.game_group_name,
            self.channel_name
        )  # Removes the player’s WebSocket connection from the game group (self.game_group_name). After this, the player will no longer receive any messages sent to the game group.

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'start_game':
            player_names = data.get('players', ['Player1', 'Player2'])
            self.game_instance = Game(player_names)
            await self.broadcast_game_state()
        
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
        """
        This method is responsible for sending game state to the WebSocket clients (the players).
        """
        state = event['state']  # Extracts the state field from event data. This message was sent by the server through the group_send method.
        await self.send(text_data=json.dumps(state))
