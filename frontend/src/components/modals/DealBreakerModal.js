import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from '../cards/PropertyCard';

const DealBreakerModal = ({ 
  isOpen, 
  onClose, 
  opponentProperties,
  onPropertySetSelect 
}) => {
  const [selectedSet, setSelectedSet] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedSet(null);
    }
  }, [isOpen]);

  const handleSetSelect = (color, cards, owner) => {
    if (selectedSet?.color === color && selectedSet?.owner.id === owner.id) {
      setSelectedSet(null);
    } else {
      setSelectedSet({ color, cards, owner });
    }
  };

  const handleSubmit = () => {
    if (selectedSet) {
      onPropertySetSelect(selectedSet);
      onClose();
    }
  };

  if (!isOpen) return null;

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

  const isCompleteSet = (cards) => {
    if (!Array.isArray(cards)) return false;
    
    // Get the color of the set (using the first non-wild card's color)
    const nonWildCard = cards.find(card => !card.isWild);
    if (!nonWildCard) return false;
    
    const color = nonWildCard.color;
    const requiredCards = setRequirements[color] || 0;
    
    return cards.length >= requiredCards;
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
            {Object.entries(opponentProperties).length > 0 ? (
              Object.entries(opponentProperties).map(([playerId, properties]) => {
                // Check if there are any complete sets
                const hasCompleteSets = Object.values(properties.sets).some(isCompleteSet);
                
                return (
                  <div key={playerId} className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                        {properties.playerName}'s Complete Property Sets
                      </h3>
                      <div className="h-0.5 flex-1 bg-gradient-to-r from-red-200 to-transparent"></div>
                    </div>
                    {hasCompleteSets ? (
                      <div className="flex flex-wrap items-start gap-4">
                        {Object.entries(properties.sets).map(([color, cards]) => (
                          isCompleteSet(cards) && (
                            <motion.div
                              key={color}
                              className="relative group"
                              variants={setVariants}
                              initial="unselected"
                              animate={selectedSet?.color === color && selectedSet?.owner.id === playerId ? "selected" : "unselected"}
                              whileHover={{ scale: 1.01 }}
                              onClick={() => handleSetSelect(color, cards, { id: playerId, name: properties.playerName })}
                            >
                              <div className="flex -space-x-20">
                                {cards.map((card, index) => (
                                  <div 
                                    key={`${card.id}-${index}`}
                                    className="relative"
                                    style={{ zIndex: cards.length - index }}
                                  >
                                    <PropertyCard
                                      {...card}
                                      className={`transition-all ${
                                        selectedSet?.color === color && selectedSet?.owner.id === playerId
                                          ? 'ring-2 ring-red-500'
                                          : ''
                                      }`}
                                    />
                                  </div>
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
                );
              })
            ) : (
              <p className="text-gray-500 italic">No properties available to steal</p>
            )}
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
