import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from '../cards/PropertyCard';
import ActionCard from '../cards/ActionCard';

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

const SlyDealModal = ({ 
  isOpen, 
  onClose, 
  modalData,
  onPropertySelect,
}) => {
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedProperty(null);
    }
  }, [isOpen]);

  const handlePropertySelect = (property) => {
    if (selectedProperty?.id === property.id) {
      setSelectedProperty(null);
    } else {
      setSelectedProperty({ ...property, owner: { id: modalData.opponentId, name: modalData.opponentName } });
    }
  };

  const handleSubmit = () => {
    if (selectedProperty) {
      onPropertySelect(selectedProperty);
      onClose();
    }
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

  const renderPropertyCard = (card, color, allCards) => {
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

    // If card is in a complete main set or complete overflow set, make it unselectable
    if ((cardInMainSet && mainSetComplete) || (cardInOverflowSet && overflowSetComplete)) {
      return (
        <motion.div
          key={`${card.id}`}
          className="cursor-not-allowed transition-all transform-gpu opacity-40 grayscale"
        >
          <PropertyCard {...card} />
        </motion.div>
      );
    }

    return (
      <motion.div
        key={`${card.id}`}
        variants={cardVariants}
        initial="unselected"
        animate={selectedProperty?.id === card.id ? "selected" : "unselected"}
        whileHover={{ scale: 1.01 }}
        onClick={() => handlePropertySelect(card)}
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
              Select a Property to Steal
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
                <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                  {modalData.opponentName}'s Properties
                </h3>
                <div className="h-0.5 flex-1 bg-gradient-to-r from-purple-200 to-transparent"></div>
              </div>
              {Object.keys(modalData.opponentProperties).length > 0 ? (
                <div className="flex flex-wrap items-start gap-4">
                  {Object.entries(modalData.opponentProperties).map(([color, cards]) => (
                    cards.map((card, index) => renderPropertyCard(card, color, cards))
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic px-4 py-6 bg-gray-50 rounded-lg text-center">
                  No properties to steal
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
            disabled={!selectedProperty}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              selectedProperty
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Steal Property
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SlyDealModal;
