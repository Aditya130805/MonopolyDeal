// Constants
export const setRequirements = {
  'brown': 2,
  'mint': 2,
  'blue': 2,
  'light blue': 3,
  'pink': 3,
  'orange': 3,
  'red': 3,
  'yellow': 3,
  'green': 3,
  'black': 4
};

export const rents = {
  'brown': [1, 2],
  'mint': [1, 2],
  'blue': [3, 8],
  'light blue': [1, 2, 3],
  'pink': [1, 2, 4],
  'orange': [1, 3, 5],
  'red': [2, 3, 6],
  'yellow': [2, 4, 6],
  'green': [2, 4, 7],
  'black': [1, 2, 3, 4]
};

/**
 * Splits property cards into main sets and overflow sets
 * Main sets contain the required number of properties plus one house and one hotel
 * Overflow sets contain excess properties and additional houses/hotels
 */
export const splitProperties = (properties) => {
  const mainSets = {};
  const overflowSets = {};

  Object.entries(properties).forEach(([color, cards]) => {
    if (!Array.isArray(cards)) {
      mainSets[color] = [];
      return;
    }

    const propertyCards = cards.filter(card => card && card.type === 'property');
    const requiredCards = setRequirements[color] || 0;
    const houseCards = cards.filter(card => card.type === 'action' && card.name.toLowerCase() === 'house');
    const hotelCards = cards.filter(card => card.type === 'action' && card.name.toLowerCase() === 'hotel');

    // Add property cards to mainSets up to requiredCards
    mainSets[color] = propertyCards.slice(0, requiredCards);

    // Place the first house and hotel in mainSets
    if (houseCards.length > 0) {
      mainSets[color].push(houseCards[0]);
    }
    if (hotelCards.length > 0) {
      mainSets[color].push(hotelCards[0]);
    }

    // Add excess property cards to overflowSets
    if (propertyCards.length > requiredCards) {
      overflowSets[color] = propertyCards.slice(requiredCards);
    }

    // Add remaining house and hotel cards to overflowSets
    if (houseCards.length > 1) {
      overflowSets[color] = (overflowSets[color] || []).concat(houseCards.slice(1));
    }
    if (hotelCards.length > 1) {
      overflowSets[color] = (overflowSets[color] || []).concat(hotelCards.slice(1));
    }
  });

  return { mainSets, overflowSets };
};

/**
 * Gets a specific player by their ID
 */
export const getPlayerById = (gameState, playerId) => {
  return gameState.players.find(player => player.id === playerId);
};

/**
 * Gets all opponent players from the game state
 */
export const getOpponentPlayers = (gameState, userId) => {
  return gameState.players.filter(player => player.id !== userId);
};
