import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropertyCard from '../cards/PropertyCard';
import ActionCard from '../cards/ActionCard';

const DealBreakerModal = ({ 
  isOpen, 
  onClose, 
  modalData,
  onPropertySetSelect 
}) => {
  const [selectedSet, setSelectedSet] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedSet(null);
    }
  }, [isOpen]);

  const handleSetSelect = (color, cards) => {
    if (selectedSet?.color === color) {
      setSelectedSet(null);
    } else {
      setSelectedSet({ color, cards, owner: { id: modalData.opponentId, name: modalData.opponentName } });
    }
  };

  const handleSubmit = () => {
    if (selectedSet) {
      onPropertySetSelect(selectedSet);
      onClose();
    }
  };

  if (!isOpen) return null;

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

  const isCompleteSet = (color, cards) => {
    if (!Array.isArray(cards)) return false;
    const propertyCards = cards.filter(card => card && card.type === 'property');
    const requiredCards = setRequirements[color] || 0;
    return propertyCards.length >= requiredCards;
  };

  const setVariants = {
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

  const setRequirements = {
    'brown': 2, 'mint': 2, 'blue': 2,
    'light blue': 3, 'pink': 3, 'orange': 3, 'red': 3, 'yellow': 3, 'green': 3,
    'black': 4
  };

  const renderCard = (card) => {
    if (card.type === 'property') {
      return (
        <PropertyCard
          {...card}
        />
      );
    } else if (card.type === 'action' && (card.name.toLowerCase() === 'house' || card.name.toLowerCase() === 'hotel')) {
      return (
        <ActionCard
          {...card}
        />
      );
    }
    return null;
  };

  // Split properties into main and overflow sets
  const { mainSets, overflowSets } = splitProperties(modalData.opponentProperties);

  // Check if there are any complete sets in either main or overflow
  const hasCompleteSets = Object.entries(mainSets).some(([color, cards]) => isCompleteSet(color, cards)) || Object.entries(overflowSets).some(([color, cards]) => isCompleteSet(color, cards));

  if (!isOpen) return null;

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
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400">
              Select a Complete Property Set to Steal
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
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                  {modalData.opponentName}'s Complete Property Sets
                </h3>
                <div className="h-0.5 flex-1 bg-gradient-to-r from-red-200 to-transparent"></div>
              </div>
              {hasCompleteSets ? (
                <div className="flex flex-wrap items-start gap-4">
                  {/* Render main sets */}
                  {Object.entries(mainSets).map(([color, cards]) => (
                    isCompleteSet(color, cards) && (
                      <motion.div
                        key={`main-${color}`}
                        className="relative group"
                        variants={setVariants}
                        initial="unselected"
                        animate={selectedSet?.color === color ? "selected" : "unselected"}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => handleSetSelect(color, cards)}
                      >
                        <div className="flex -space-x-20">
                          {cards.map((card, cardIndex) => (
                            <motion.div
                              key={`${card.id}-${cardIndex}`}
                              className={`transform transition-transform duration-200`}
                              style={{
                                zIndex: cards.length - cardIndex,
                                marginLeft: cardIndex > 0 ? '-5rem' : '0'
                              }}
                            >
                              {renderCard(card)}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )
                  ))}
                  
                  {/* Render complete overflow sets */}
                  {Object.entries(overflowSets).map(([color, cards]) => (
                    isCompleteSet(color, cards) && (
                      <motion.div
                        key={`overflow-${color}`}
                        className="relative group"
                        variants={setVariants}
                        initial="unselected"
                        animate={selectedSet?.color === color ? "selected" : "unselected"}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => handleSetSelect(color, cards)}
                      >
                        <div className="flex -space-x-20">
                          {cards.map((card, cardIndex) => (
                            <motion.div
                              key={`${card.id}-${cardIndex}`}
                              className={`transform transition-transform duration-200`}
                              style={{
                                zIndex: cards.length - cardIndex,
                                marginLeft: cardIndex > 0 ? '-5rem' : '0'
                              }}
                            >
                              {renderCard(card)}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No complete property sets available</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedSet}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${
              selectedSet
                ? 'bg-gradient-to-r from-red-600 to-red-400 hover:from-red-700 hover:to-red-500'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Steal Set
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DealBreakerModal;
