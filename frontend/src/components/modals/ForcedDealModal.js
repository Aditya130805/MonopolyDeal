import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import PropertyCard from '../cards/PropertyCard';
import ActionCard from '../cards/ActionCard';
import { useGameState } from '../../contexts/GameStateContext';

const setRequirements = {
  'brown': 2,
  'mint': 2,
  'blue': 2,
  'light blue': 3,
  'pink': 3,
  'orange': 3,
  'red': 3,
  'yellow': 3,
  'green': 3,
  'black': 4,
};

const ForcedDealModal = ({ 
  isOpen, 
  onClose,
  modalData,
  onPropertySelect 
}) => {
  if (!modalData) return null;

  const { gameState } = useGameState();
  if (isOpen) {
    console.log("Forced Deal gameState: ", gameState);
  }
  
  const [selectedOpponentProperty, setSelectedOpponentProperty] = useState(null);
  const [selectedUserProperty, setSelectedUserProperty] = useState(null);
  
  // Use refs to preserve state across re-renders caused by card notifications
  const selectedOpponentPropertyRef = useRef(null);
  const selectedUserPropertyRef = useRef(null);
  const player = gameState?.players.find(p => p.id === modalData.userId);
  const opponents = gameState?.players.filter(p => modalData.opponentIds.includes(p.id));
  const card = modalData.card;

  useEffect(() => {
    if (isOpen) {
      // Only reset state if this is a new modal session
      const isNewSession = 
        !selectedOpponentPropertyRef.current || 
        (modalData.opponentIds.join(',') !== selectedOpponentPropertyRef.current.opponentIds);
      
      if (isNewSession) {
        // Reset state for new session
        setSelectedOpponentProperty(null);
        setSelectedUserProperty(null);
        selectedOpponentPropertyRef.current = {
          property: null,
          opponentIds: modalData.opponentIds.join(',')
        };
        selectedUserPropertyRef.current = null;
      } else {
        // Restore state from refs for the same session
        setSelectedOpponentProperty(selectedOpponentPropertyRef.current.property);
        setSelectedUserProperty(selectedUserPropertyRef.current);
      }
    }
  }, [isOpen, modalData]);

  const handleOpponentPropertySelect = (property, opponent) => {
    let newSelectedOpponentProperty;
    
    if (selectedOpponentProperty?.id === property.id) {
      newSelectedOpponentProperty = null;
      setSelectedOpponentProperty(null);
    } else {
      newSelectedOpponentProperty = { ...property, ownerId: opponent.id };
      setSelectedOpponentProperty(newSelectedOpponentProperty);
    }
    
    // Update ref to preserve state
    selectedOpponentPropertyRef.current = {
      property: newSelectedOpponentProperty,
      opponentIds: modalData.opponentIds.join(',')
    };
  };

  const handleUserPropertySelect = (property) => {
    let newSelectedUserProperty;
    
    if (selectedUserProperty?.id === property.id) {
      newSelectedUserProperty = null;
      setSelectedUserProperty(null);
    } else {
      newSelectedUserProperty = property;
      setSelectedUserProperty(newSelectedUserProperty);
    }
    
    // Update ref to preserve state
    selectedUserPropertyRef.current = newSelectedUserProperty;
  };

  const handleSubmit = () => {
    if (selectedOpponentProperty && selectedUserProperty) {
      onPropertySelect(modalData, selectedOpponentProperty, selectedUserProperty);
      
      // Reset refs when properties are selected
      selectedOpponentPropertyRef.current = {
        property: null,
        opponentIds: ''
      };
      selectedUserPropertyRef.current = null;
      
      onClose();
    }
  };

  const splitProperties = (properties) => {
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

      // Place house and hotel cards in mainSets
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

  const isInMainSet = (card, color, mainSets) => {
    if (!mainSets[color]) return false;
    return mainSets[color].some(mainCard => mainCard.id === card.id);
  };

  const isInOverflowSet = (card, color, overflowSets) => {
    if (!overflowSets[color]) return false;
    return overflowSets[color].some(overflowCard => overflowCard.id === card.id);
  };

  const isMainSetComplete = (color, mainSets) => {
    if (!mainSets[color]) return false;
    const propertyCards = mainSets[color].filter(card => card && card.type === 'property');
    const requiredCards = setRequirements[color] || 0;
    return propertyCards.length >= requiredCards;
  };

  const isOverflowSetComplete = (color, overflowSets) => {
    if (!overflowSets[color]) return false;
    const propertyCards = overflowSets[color].filter(card => card && card.type === 'property');
    const requiredCards = setRequirements[color] || 0;
    return propertyCards.length >= requiredCards;
  };

  const renderPropertyCard = (card, color, allCards, isOpponentCard = true, opponent) => {
    // Handle house and hotel cards
    if (card.type === 'action' && (card.name.toLowerCase() === 'house' || card.name.toLowerCase() === 'hotel')) {
      return (
        <motion.div
          key={`${card.id}`}
          className="cursor-not-allowed transition-all transform-gpu opacity-40 grayscale"
        >
          <ActionCard {...card} />
        </motion.div>
      );
    }

    // Split properties into main and overflow sets
    const { mainSets, overflowSets } = splitProperties({ [color]: allCards });
    
    // Check if card is in main set and if main set is complete
    const cardInMainSet = isInMainSet(card, color, mainSets);
    const mainSetComplete = isMainSetComplete(color, mainSets);

    // Check if card is in overflow set and if overflow set is complete
    const cardInOverflowSet = isInOverflowSet(card, color, overflowSets);
    const overflowSetComplete = isOverflowSetComplete(color, overflowSets);

    // For opponent's cards, prevent selection from complete sets
    if (isOpponentCard && ((cardInMainSet && mainSetComplete) || (cardInOverflowSet && overflowSetComplete))) {
      return (
        <motion.div
          key={`${card.id}`}
          className="cursor-not-allowed transition-all transform-gpu opacity-40 grayscale"
        >
          <PropertyCard {...card} />
        </motion.div>
      );
    }

    const selectedProperty = isOpponentCard ? selectedOpponentProperty : selectedUserProperty;
    const handleSelect = isOpponentCard ? () => handleOpponentPropertySelect(card, opponent) : () => handleUserPropertySelect(card);

    return (
      <motion.div
        key={`${card.id}`}
        variants={cardVariants}
        initial="unselected"
        animate={selectedProperty?.id === card.id ? "selected" : "unselected"}
        whileHover={{ scale: 1.01 }}
        onClick={handleSelect}
        className={`cursor-pointer transition-all transform-gpu ${
          selectedProperty?.id === card.id 
            ? '' 
            : selectedProperty
              ? 'opacity-40 grayscale'
              : 'hover:-translate-y-1'
        }`}
      >
        <PropertyCard {...card} />
      </motion.div>
    );
  };

  if (!isOpen) return null;

  const cardVariants = {
    unselected: { 
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 500, damping: 30 }
    },
    selected: { 
      scale: 1,
      y: -10,
      transition: { type: "spring", stiffness: 500, damping: 30 }
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white/95 rounded-2xl p-6 max-w-[1000px] w-full max-h-[90vh] shadow-2xl border border-white/20 flex flex-col"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
              Select Properties to Swap
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
          <div className="space-y-6">
            {/* Opponents' Properties */}
            {opponents.map((opponent) => (
              <div key={opponent.id} className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                    {opponent.name}'s Properties
                  </h3>
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-purple-200 to-transparent"></div>
                </div>
                {Object.keys(opponent.properties).length > 0 ? (
                  <div className="flex flex-wrap items-start gap-4">
                    {Object.entries(opponent.properties).map(([color, cards]) => (
                      cards.map((card, index) => renderPropertyCard(card, color, cards, true, opponent))
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 italic px-4 py-6 bg-gray-50 rounded-lg text-center">
                    No properties to swap
                  </div>
                )}
              </div>
            ))}

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-purple-200 to-transparent"></div>
              <span className="text-purple-600 font-bold">Swap With</span>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-purple-200 to-transparent"></div>
            </div>

            {/* User's Properties */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                  Your Properties
                </h3>
                <div className="h-0.5 flex-1 bg-gradient-to-r from-purple-200 to-transparent"></div>
              </div>
              {Object.keys(player.properties).length > 0 ? (
                <div className="flex flex-wrap items-start gap-4">
                  {Object.entries(player.properties).map(([color, cards]) => (
                    cards.map((card, index) => renderPropertyCard(card, color, cards, false))
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic px-4 py-6 bg-gray-50 rounded-lg text-center">
                  No properties to swap
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end gap-3 pt-3 border-t border-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedOpponentProperty || !selectedUserProperty}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              selectedOpponentProperty && selectedUserProperty
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-purple-400 cursor-not-allowed'
            }`}
          >
            Swap Properties
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ForcedDealModal;
