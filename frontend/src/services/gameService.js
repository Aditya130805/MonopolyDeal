const API_BASE_URL = 'http://localhost:8000/api';

export const createRoom = async () => {
    try {
        const accessToken = localStorage.getItem('accessToken');
        // console.log("Access token:", accessToken);

        const response = await fetch(`${API_BASE_URL}/room/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`, // Include the JWT access token
                'Accept': 'application/json',
            },
            credentials: 'include'
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to create room');
        }
        return data;
    } catch (error) {
        console.error('Error creating room:', error);
        throw error;
    }
};

export const joinRoom = async (roomId) => {
    try {
        const accessToken = localStorage.getItem('accessToken');
        // console.log("Access token:", accessToken);
        
        const response = await fetch(`${API_BASE_URL}/room/${roomId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`, // Include the JWT access token
                'Accept': 'application/json',
            },
            credentials: 'include'
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to get room');
        }
        return data;
    } catch (error) {
        console.error('Error getting room:', error);
        throw error;
    }
};

// WebSocket connection management
let socket = null;

// export const connectToGameRoom = (roomId, onUpdate, isCreator = false) => {
//     if (socket) {
//         socket.close();
//     }

//     const wsUrl = `ws://localhost:8000/ws/game/${roomId}/?is_creator=${isCreator}`;
//     console.log("Connecting to WebSocket:", wsUrl);
//     socket = new WebSocket(wsUrl);

//     socket.onopen = () => {
//         console.log("WebSocket connection established");
//     };

//     socket.onmessage = (event) => {
//         try {
//             const data = JSON.parse(event.data);
//             console.log("WebSocket message received:", data);
            
//             if (data.type === 'rejection') {
//                 console.log("Received rejection, sending acknowledgment");
//             }
            
//             onUpdate(data);
//         } catch (error) {
//             console.error("Error processing WebSocket message:", error);
//         }
//     };

//     socket.onclose = () => {
//         console.log('WebSocket connection closed');
//     };

//     socket.onerror = (error) => {
//         console.error('WebSocket error:', error);
//         onUpdate({ type: 'error', message: 'Connection error' });
//     };

//     return socket;
// };

// export const disconnectFromGameRoom = () => {
//     if (socket) {
//         socket.close();
//         socket = null;
//     }
// };
