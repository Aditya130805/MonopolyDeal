// WebSocketContext.js
import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const WS_BASE_URL = process.env.REACT_APP_API_BASE_URL ? process.env.REACT_APP_API_BASE_URL.replace('http', 'ws').replace('/api', '') : 'ws://localhost:8000';

const WebSocketContext = createContext(null);

// Static connection management (outside of component lifecycle)
const connectionLocks = {};

function isRoomRoute(pathname) {
    return pathname.startsWith('/room/');
}

function isGameRoute(pathname) {
    return pathname.startsWith('/game/');
}

function isValidWebSocketRoute(pathname) {
    return isRoomRoute(pathname) || isGameRoute(pathname);
}

function getRoomIdFromPath(pathname) {
    const parts = pathname.split('/');
    return parts[parts.length - 1];
}

const connectWebSocket = (roomId, playerId) => {
    // Check if connection already exists or is in progress
    if (connectionLocks[playerId]?.[roomId]) {
        console.log(`Connection for room ${roomId} is already in progress.`);
        return connectionLocks[playerId][roomId];
    }

    // Initialize player's connection locks if not exists
    if (!connectionLocks[playerId]) {
        connectionLocks[playerId] = {};
    }

    // Create new connection promise
    const lock = new Promise((resolve, reject) => {
        const ws = new WebSocket(`${WS_BASE_URL}/ws/game/${roomId}/`);


        ws.onopen = () => {
            console.log(`WebSocket connected for room ${roomId}`);
            ws.send(JSON.stringify({ 
                action: 'establish_connection', 
                player_id: playerId 
            }));
            resolve(ws);
        };

        // Message handling to be defined in components themselves (ws.onmessage)

        ws.onclose = () => {
            console.log(`WebSocket disconnected for room ${roomId}`);
            delete connectionLocks[playerId][roomId];
        };

        ws.onerror = (error) => {
            console.error(`WebSocket error in room ${roomId}:`, error);
            reject(error);
            delete connectionLocks[playerId][roomId];
        };
    });

    // Store the connection lock
    connectionLocks[playerId][roomId] = lock;
    return lock;
};

export function WebSocketProvider({ children, playerId }) {
    const [ws, setWs] = useState(null); // Use state for the WebSocket
    const [isLoading, setIsLoading] = useState(true); // Add loading state
    const location = useLocation();
    const navigate = useNavigate();
    const currentRoomId = getRoomIdFromPath(location.pathname);

    useEffect(() => {
        if (!isValidWebSocketRoute(location.pathname)) {
            // Not on a room or game route, close socket
            if (ws) {
                console.log('Disconnecting WebSocket - not on a valid route');
                ws.close();
                setWs(null);
                if (connectionLocks[playerId]?.[currentRoomId]) {
                    delete connectionLocks[playerId][currentRoomId];
                }
            }
            return; // Important: Exit early
        }

        if (isGameRoute(location.pathname) && !ws) {
            console.error('Cannot enter game room directly. Please join a room first.');
            navigate('/play');
            return
        }

        if (isRoomRoute(location.pathname) && !ws) {
            setIsLoading(true); // Set loading before connecting
            connectWebSocket(currentRoomId, playerId)
                .then(newWs => {
                    setWs(newWs);
                    console.log("WebSocket established:", newWs);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error('Failed to establish WebSocket connection:', error);
                    setIsLoading(false);
                });
        }

        return () => {
            if (ws && getRoomIdFromPath(location.pathname) !== currentRoomId) {
                console.log('Disconnecting WebSocket - room changed');
                ws.close();
                setWs(null);
                if (connectionLocks[playerId]?.[currentRoomId]) {
                    delete connectionLocks[playerId][currentRoomId];
                }
            }
        };
    }, [playerId, location.pathname]);

    return (
        <WebSocketContext.Provider value={{ socket: ws, wsLoading: isLoading }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}
