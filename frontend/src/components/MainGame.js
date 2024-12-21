// import React, { useEffect } from 'react';
// import wsManager from '../services/WebSocketManager';

const MainGame = ({ roomId }) => {

//     const fetchRooms = async () => {
//         try {
//             const response = await fetch('/api/rooms'); // Adjust the API endpoint as necessary
//             // const data = await response.json();
//             console.log('Active Rooms:', response); // Log the active rooms to the console
//         } catch (error) {
//             console.error('Error fetching rooms:', error);
//         }
//     };

//     const handleMessage = (event) => {
//         try {
//             console.log("Message handler 2!");
//             console.log(`WebSocket message in room ${roomId}:`, event.data);
//             const data = JSON.parse(event.data);
//             // TODO: Implement game logic
//         } catch (error) {
//             console.error("Error parsing WebSocket message:", error);
//         }
//     };

//     useEffect(() => {
//         // Set a new message handler for this page
//         wsManager.setMessageHandler(roomId, handleMessage);
//         fetchRooms();

//         return () => {
//             // Do not disconnect the WebSocket to persist the connection
//         };
//     }, [roomId]);

//     return (
//         <div>
//             <h1>Game Page for Room: {roomId}</h1>
//             <p>Game content goes here...</p>
//         </div>
//     );
};

export default MainGame;
