from channels.generic.websocket import AsyncWebsocketConsumer
import json

class GameConsumer(AsyncWebsocketConsumer):
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
        """
        This method handles incoming WebSocket messages (from the player). It’s triggered every time the server receives a message from the client.
        """
        # Handle incoming messages
        data = json.loads(text_data)  # Converts the raw WebSocket message (which is a string) into a Python dictionary using JSON parsing.
        action = data.get('action', '')
        if action == 'start_game':
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'game_event',
                    'message': 'Game has started!'
                }
            )  # Sends a message to the game group (monopolydeal_game) that contains an event type ('game_event') and a message ('Game has started!'). This message will be delivered to all players connected to this game.

    async def game_event(self, event):
        """
        This method is responsible for sending messages to the WebSocket client (the player).
        """
        # Send message to WebSocket
        message = event['message']  # Extracts the message field from the event data. This message was sent by the server through the group_send method.
        await self.send(text_data=json.dumps({
            'message': message
        }))  # Sends the message to the player (via WebSocket) by converting it into a JSON string.
