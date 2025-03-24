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

// Apply partial state updates to the current game state
export const applyStateUpdates = (currentState, updates) => {
  // Create a deep copy of the current state to avoid mutation
  const newState = JSON.parse(JSON.stringify(currentState));
  
  // Apply simple field updates
  Object.keys(updates).forEach(key => {
    // Handle special case for players array
    if (key === 'players') {
      // Process each player update
      updates.players.forEach(playerUpdate => {
        const playerId = playerUpdate.id;
        // Find the player in the current state
        const playerIndex = newState.players.findIndex(p => p.id === playerId);
        
        if (playerIndex >= 0) {
          // Update existing player
          newState.players[playerIndex] = {
            ...newState.players[playerIndex],
            ...playerUpdate
          };
        } else {
          // Add new player
          newState.players.push(playerUpdate);
        }
      });
    } else {
      // For all other fields, simply replace the value
      newState[key] = updates[key];
    }
  });
  
  return newState;
};

export const setGameStateFromBackend = (newState, isFullState, currentState) => {
  if (isFullState) {
    // If it's a full state update, replace the entire state
    return { ...newState };
  } else {
    // If it's a partial update, apply the changes to the current state
    return applyStateUpdates(currentState, newState);
  }
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
    const isFullState = data.is_full_state;
    setGameState(prevState => setGameStateFromBackend(state, isFullState, prevState));
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
    setGameStateFromBackend,
    applyStateUpdates
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
