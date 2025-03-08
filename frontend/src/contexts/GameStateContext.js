import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './WebSocketContext';
import { useWebSocketMessageQueue } from './WebSocketMessageQueue';

// Game state helper functions
export const createEmptyGameState = () => ({
  deck_count: 0,
  players: [],
  discard_pile: null,
  current_turn: null,  // player ID
  winner: null,
  actions_remaining: 3
});

export const createPlayerState = (id, name) => ({
  id,
  name,
  hand: [],
  properties: {},  // Map of color to property sets
  bank: []
});

export const updateGameState = (currentState, updates) => {
  return {
    ...currentState,
    ...updates
  };
};

export const updatePlayerState = (gameState, playerId, updates) => {
  return {
    ...gameState,
    players: gameState.players.map(player => 
      player.id === playerId
        ? { ...player, ...updates }
        : player
    )
  };
};

export const setGameStateFromBackend = (newState) => {
  return { ...newState };
};

const GameStateContext = createContext();

export const GameStateProvider = ({ children }) => {
  const [gameState, setGameState] = useState(createEmptyGameState());
  const { socket } = useWebSocket();
  const { enqueueMessage } = useWebSocketMessageQueue();
  const gameStateRef = useRef(gameState);

  // Keep the ref updated with the latest state
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // WebSocket message handler for game updates
  const handleGameUpdate = useCallback((data) => {
    const state = data.state;
    setGameState(setGameStateFromBackend(state));
  }, []);

  // Process WebSocket messages
  const handleWebSocketMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'game_update') {
        handleGameUpdate(data);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message in GameStateContext:", error);
    }
  }, [handleGameUpdate]);

  // Set up WebSocket listener for game state updates
  useEffect(() => {
    if (socket) {
      // Create a dedicated message handler for the GameStateContext
      const messageHandler = (event) => {
        enqueueMessage(event, handleWebSocketMessage);
      };

      // Add event listener
      socket.addEventListener('message', messageHandler);

      // Clean up
      return () => {
        socket.removeEventListener('message', messageHandler);
      };
    }
  }, [socket, enqueueMessage, handleWebSocketMessage]);

  const value = {
    gameState,
    setGameState,
    updateGameState,
    updatePlayerState,
    setGameStateFromBackend
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};
