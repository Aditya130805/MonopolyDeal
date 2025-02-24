import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MoneyCard from '../cards/MoneyCard';
import PropertyCard from '../cards/PropertyCard';
import ActionCard from '../cards/ActionCard';
import { useGameState } from '../../contexts/GameStateContext';

const RentModal = ({ 
  isOpen, 
  onClose,
  modalData, 
  onPaymentSubmit 
}) => {
  const { gameState, setGameState } = useGameState();
  const [selectedCards, setSelectedCards] = useState([]);
  const [totalSelected, setTotalSelected] = useState(0);
  const [hasSelectedAll, setHasSelectedAll] = useState(false);

  useEffect(() => {
    if (isOpen && modalData && gameState.players) {
      setSelectedCards([]);
      setTotalSelected(0);
      
      const player = gameState.players.find(p => p.id === modalData.userId);
      if (player) {
        // If there are no selectable cards at all, set hasSelectedAll to true
        const allCards = [...player.bank, ...Object.values(player.properties).flat()];
        const nonWildCards = allCards.filter(c => !(c.type.toLowerCase() === 'property' && c.name.toLowerCase() === 'wild'));
        setHasSelectedAll(nonWildCards.length === 0);
      }
    }
  }, [isOpen, modalData, gameState.players]);

  if (!modalData || !isOpen || !gameState.players) return null;

  const amountDue = modalData.amountDue;
  const rentType = modalData.rentType;
  const player = gameState.players.find(p => p.id === modalData.userId);
  const opponent = gameState.players.find(p => p.id === modalData.opponentId);

  if (!player || !opponent) return null;

  const handleCardSelect = (card) => {
    // Don't allow selecting completely wild property cards
    if (card.type.toLowerCase() === 'property' && card.name.toLowerCase() === 'wild') {
      return;
    }

    const isSelected = selectedCards.some(c => c.id === card.id);
    
    if (isSelected) {
      setSelectedCards(prev => prev.filter(c => c.id !== card.id));
      setTotalSelected(prev => prev - card.value);
    } else {
      setSelectedCards(prev => [...prev, card]);
      setTotalSelected(prev => prev + card.value);
    }

    // Check if all selectable cards have been selected
    const allCards = [...player.bank, ...Object.values(player.properties).flat()];
    const nonWildCards = allCards.filter(c => !(c.type.toLowerCase() === 'property' && c.name.toLowerCase() === 'wild'));
    const selectedCount = selectedCards.length + (isSelected ? -1 : 1); // Account for the current card being toggled
    setHasSelectedAll(selectedCount === nonWildCards.length);
  };

  const isCardSelectable = (card) => {
    // Don't allow selecting completely wild property cards
    if (card.type.toLowerCase() === 'property' && card.name.toLowerCase() === 'wild') {
      return false;
    }
    const isSelected = selectedCards.some(c => c.id === card.id);
    return isSelected || (totalSelected < amountDue && !hasSelectedAll);
  };

  const handleSubmit = () => {
    onPaymentSubmit(modalData, selectedCards);
    onClose();
  };

  const cardVariants = {
    unselected: { 
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 500, damping: 30 }
    },
    selected: { 
      scale: 1,
      y: -10,
      transition: { type: "spring", stiffness: 500, damping: 30 },
      
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
        {/* Header with Payment Info */}
        <div className="relative flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500">Pay {opponent.name}</div>
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                {amountDue}M
              </div>
            </div>
            <div className="h-10 w-px bg-gray-200"></div>
            <div>
              <div className="text-sm font-medium text-gray-500">Selected</div>
              <div className={`text-2xl font-bold bg-clip-text text-transparent ${
                totalSelected >= amountDue || hasSelectedAll
                  ? 'bg-gradient-to-r from-green-600 to-green-400'
                  : 'bg-gradient-to-r from-gray-600 to-gray-400'
              }`}>
                {totalSelected}M
              </div>
            </div>
            <div className="h-10 w-px bg-gray-200"></div>
            <div>
              <div className="text-sm font-medium text-gray-500">Reason</div>
              <div className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
                {rentType === 'rent' ? 'Rent' :
                 rentType === 'it\'s your birthday' ? 'It\'s Your Birthday!' :
                 rentType === 'debt collector' ? 'Debt Collector' :
                 rentType === 'double_the_rent' ? 'Double the Rent!' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
          {/* Bank Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Bank Cards</h3>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-200 to-transparent"></div>
            </div>
            <div className="flex flex-wrap items-start gap-4 pr-4">
              {player.bank.map(card => (
                <motion.div 
                  key={card.id}
                  variants={cardVariants}
                  initial="unselected"
                  animate={selectedCards.some(c => c.id === card.id) ? "selected" : "unselected"}
                  whileHover={{ scale: isCardSelectable(card) ? 1.01 : 1 }}
                  onClick={() => isCardSelectable(card) && handleCardSelect(card)}
                  className={`cursor-pointer transition-all transform-gpu min-w-0 basis-[calc(33.333%-1.2rem)] sm:basis-[calc(25%-1.2rem)] md:basis-[calc(20%-1.2rem)] lg:basis-[calc(20%-1.2rem)] ${
                    selectedCards.some(c => c.id === card.id) 
                      ? '' 
                      : isCardSelectable(card) 
                        ? 'hover:-translate-y-1'
                        : 'opacity-40 grayscale'
                  }`}
                  style={{ width: 'fit-content' }}
                >
                  {card.type.toLowerCase() === 'money' ? 
                  <MoneyCard {...card} /> :
                  <ActionCard {...card} />}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Properties Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Properties</h3>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-200 to-transparent"></div>
            </div>
            <div className="flex flex-wrap items-start gap-4 pr-4">
              {Object.values(player.properties).flat().map(card => (
                <motion.div 
                  key={card.id}
                  variants={cardVariants}
                  initial="unselected"
                  animate={selectedCards.some(c => c.id === card.id) ? "selected" : "unselected"}
                  whileHover={{ scale: isCardSelectable(card) ? 1.01 : 1 }}
                  onClick={() => isCardSelectable(card) && handleCardSelect(card)}
                  className={`cursor-pointer transition-all transform-gpu min-w-0 basis-[calc(33.333%-1.2rem)] sm:basis-[calc(25%-1.2rem)] md:basis-[calc(20%-1.2rem)] lg:basis-[calc(20%-1.2rem)] ${
                    selectedCards.some(c => c.id === card.id) 
                      ? '' 
                      : isCardSelectable(card) 
                        ? 'hover:-translate-y-1'
                        : 'opacity-40 grayscale'
                  }`}
                  style={{ width: 'fit-content' }}
                >
                  {card.type.toLowerCase() === 'property' ? 
                  <PropertyCard {...card} /> : 
                  <ActionCard {...card} />}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end gap-3 pt-3 border-t border-gray-200 shrink-0">
          <button
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              totalSelected >= amountDue || hasSelectedAll
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            onClick={handleSubmit}
            disabled={!hasSelectedAll && totalSelected < amountDue}
          >
            Pay {totalSelected}M
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RentModal;
