// Game state structure for Monopoly Deal multiplayer
export const createEmptyGameState = () => ({
  deck_count: 0,
  players: [],
  discard_pile: null,
  current_turn: null,  // player ID
  winner: null,
  actions_remaining: 3
});

// Helper function to create a new player state object
export const createPlayerState = (id, name) => ({
  id,
  name,
  hand: [],
  properties: {},  // Map of color to property sets
  bank: []
});

// Helper function to update game state immutably
export const updateGameState = (currentState, updates) => {
  return {
    ...currentState,
    ...updates
  };
};

// Helper function to update a specific player's state
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

// Helper function to replace entire game state with new data from backend
export const setGameStateFromBackend = (newState) => {
  return { ...newState };
};

// Card type definitions for reference
/*
Action Card:
{
  type: 'action',
  id: number,
  name: string,
  value: number,
  description: string,
  rentColors?: string[] // Only for rent cards
}

Property Card:
{
  type: 'property',
  id: number,
  name: string,
  color: string | string[], // string[] for wild cards
  currentColor: string,
  value: number | null,
  rent: number[],
  isWild: boolean,
  isUtility: boolean,
  isRailroad: boolean
}

// Example game state (exactly matching backend):
/*
{
  deck_count: 96,
  players: [
    {
      id: string,
      name: string,
      hand: Card[],
      properties: {},  // Map of color to property sets
      bank: Card[]
    }
  ],
  discard_pile: null | Card[],
  current_turn: string | null,  // player ID
  winner: string | null,  // player ID
  actions_remaining: number
}
*/
