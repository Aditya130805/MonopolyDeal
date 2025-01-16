import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from '../cards/PropertyCard';

const ForcedDealModal = ({ 
  isOpen, 
  onClose, 
  opponentProperties,
  userProperties,
  onPropertySelect 
}) => {
  const [selectedOpponentProperty, setSelectedOpponentProperty] = useState(null);
  const [selectedUserProperty, setSelectedUserProperty] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedOpponentProperty(null);
      setSelectedUserProperty(null);
    }
  }, [isOpen]);

  const handleOpponentPropertySelect = (property, owner) => {
    if (selectedOpponentProperty?.id === property.id) {
      setSelectedOpponentProperty(null);
    } else {
      setSelectedOpponentProperty({ ...property, owner });
    }
  };

  const handleUserPropertySelect = (property) => {
    if (selectedUserProperty?.id === property.id) {
      setSelectedUserProperty(null);
    } else {
      setSelectedUserProperty(property);
    }
  };

  const handleSubmit = () => {
    if (selectedOpponentProperty && selectedUserProperty) {
      onPropertySelect(selectedOpponentProperty, selectedUserProperty);
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

  // Get the first opponent's properties
  const opponent = Object.values(opponentProperties || {})[0];
  const opponentCards = opponent ? Object.values(opponent.sets || {}).flat() : [];

  // Get the user's properties
  const user = Object.values(userProperties || {})[0];
  const userCards = user ? Object.values(user.sets || {}).flat() : [];

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
            {/* Opponent Properties Section */}
            {opponent && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                    {opponent.playerName}'s Properties
                  </h3>
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-purple-200 to-transparent"></div>
                </div>
                <div className="flex flex-wrap items-start gap-4">
                  {opponentCards.map((card, index) => (
                    <motion.div
                      key={`${card.id}-${index}`}
                      variants={cardVariants}
                      initial="unselected"
                      animate={selectedOpponentProperty?.id === card.id ? "selected" : "unselected"}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => handleOpponentPropertySelect(card, { id: Object.keys(opponentProperties)[0], name: opponent.playerName })}
                      className={`cursor-pointer transition-all transform-gpu ${
                        selectedOpponentProperty?.id === card.id 
                          ? '' 
                          : selectedOpponentProperty
                            ? 'opacity-40 grayscale'
                            : 'hover:-translate-y-1'
                      }`}
                    >
                      <PropertyCard {...card} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-purple-200 to-transparent"></div>
              <span className="text-purple-600 font-bold">Swap With</span>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-purple-200 to-transparent"></div>
            </div>

            {/* User Properties Section */}
            {user && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                    Your Properties
                  </h3>
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-purple-200 to-transparent"></div>
                </div>
                <div className="flex flex-wrap items-start gap-4">
                  {userCards.map((card, index) => (
                    <motion.div
                      key={`${card.id}-${index}`}
                      variants={cardVariants}
                      initial="unselected"
                      animate={selectedUserProperty?.id === card.id ? "selected" : "unselected"}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => handleUserPropertySelect(card)}
                      className={`cursor-pointer transition-all transform-gpu ${
                        selectedUserProperty?.id === card.id 
                          ? '' 
                          : selectedUserProperty
                            ? 'opacity-40 grayscale'
                            : 'hover:-translate-y-1'
                      }`}
                    >
                      <PropertyCard {...card} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-4 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedOpponentProperty || !selectedUserProperty}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${
              selectedOpponentProperty && selectedUserProperty
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gray-400 cursor-not-allowed'
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
