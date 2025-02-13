import React, { createContext, useContext, useState } from 'react';

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
