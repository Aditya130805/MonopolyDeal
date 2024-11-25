import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://127.0.0.1:8000/ws/game/"  # WebSocket server URL

    try:
        async with websockets.connect(uri) as websocket:
            # Send a message to the WebSocket server
            message = {"action": "start_game"}
            print(f"Sending: {message}")
            await websocket.send(json.dumps(message))

            # Wait for a response
            response = await websocket.recv()
            print(f"Received: {response}")

    except Exception as e:
        print(f"Error: {e}")

# Run the test
asyncio.run(test_websocket())
