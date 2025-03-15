import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { BanknotesIcon, ArrowTrendingUpIcon, HomeIcon } from '@heroicons/react/24/outline';
import CardBack from '../cards/CardBack';
import { motion, AnimatePresence } from 'framer-motion';
import PropertySet from './PropertySet';
import { handleCardDropBank, handleCardDropProperty } from '../actions/DropZoneHandlers';

const BankAndCards = ({ 
  hand, 
  bank,
  properties,
  playerId,
  isOpponent = false, 
  DraggableCard,
  renderCardContent,
  isThreePlayer = false
}) => {
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);

  // Bank calculations
  const moneyCards = bank;
  const denominations = [1, 2, 3, 4, 5, 10];
  
  // Initialize counts object
  const counts = {};
  for (const val of denominations) {
    counts[val] = 0;
    for (const card of moneyCards) {
      if (card.value === val) {
        counts[val]++;
      }
    }
  }

  // Calculate total
  let total = 0;
  for (const card of moneyCards) {
    total += card.value;
  }

  // Bank drop zone
  const { setNodeRef: setBankRef, isOver: isBankOver } = useDroppable({
    id: 'bank',
    data: {
      accepts: ['card'],
      onDrop: handleCardDropBank
    }
  });

  // Property drop zone
  const { setNodeRef: setPropertyRef, isOver: isPropertyOver } = useDroppable({
    id: 'property'
  });

  // Cards rendering calculations
  const totalCards = hand.length;
  const fanAngleRange = 20; // Total angle range for the fan effect

  const renderCompactBank = () => (
    <div 
      className="bg-green-200/80 rounded-xl px-6 py-4 flex items-center border-2 border-green-400 cursor-pointer hover:bg-green-300/80 transition-colors shrink-0 relative"
      onMouseEnter={() => setShowBankDetails(true)}
      onMouseLeave={() => setShowBankDetails(false)}
      ref={!isOpponent ? setBankRef : null}
    >
      <div className="relative">
        <div className="flex flex-col items-center gap-2">
          <div className="p-2.5 bg-green-300 rounded-lg">
            <BanknotesIcon className="w-7 h-7 text-green-700" />
          </div>
          <span className="text-xs font-medium text-green-600 uppercase tracking-wider">Bank</span>
          <span className="text-lg font-bold text-green-800">${total}M</span>
        </div>

        {/* Hover Popup */}
        {showBankDetails && (
          <div className="absolute top-[-1.5rem] left-[calc(100%+8px)] bg-white rounded-lg shadow-lg border border-green-300 p-3 min-w-[250px] z-50">
            {/* Arrow */}
            <div className="absolute top-[2.5rem] -left-2 w-3 h-3 bg-white transform rotate-45 border-l border-b border-green-300"></div>
            
            <div className="relative">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-green-200 rounded-md">
                  <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-green-700" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">Bank Portfolio</h3>
                <div className="ml-auto">
                  <span className="text-sm font-bold text-green-700">${total}M</span>
                </div>
              </div>
              
              {/* Grid of denominations */}
              <div className="grid grid-cols-3 gap-1.5">
                {denominations.map(value => (
                  <div 
                    key={value}
                    className={`rounded-md p-1.5 ${
                      counts[value] > 0 
                        ? 'bg-green-100 ring-1 ring-green-300' 
                        : 'bg-gray-50 ring-1 ring-gray-200'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-sm font-bold ${
                        counts[value] > 0 ? 'text-green-800' : 'text-gray-400'
                      }`}>
                        ${value}M
                      </div>
                      <div className={`text-xs ${
                        counts[value] > 0 ? 'text-green-700' : 'text-gray-400'
                      }`}>
                        ×{counts[value]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {!isOpponent && isBankOver && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-green-500/30 via-green-400/20 to-green-300/10 backdrop-blur-sm rounded-xl flex items-center justify-center"
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        >
          <div className="text-green-700 font-semibold text-lg transform hover:scale-105 transition-transform">
            Drop to Bank
          </div>
        </div>
      )}
    </div>
  );

  const renderFullBank = () => (
    <div 
      ref={!isOpponent ? setBankRef : null}
      className={`bg-white/95 rounded-lg p-3 shadow-lg ${isOpponent ? 'transform rotate-180' : ''} w-[300px] min-w-[250px] flex-shrink-1 relative transition-all duration-100`}
    >
      {!isOpponent && isBankOver && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-emerald-400/20 to-emerald-300/10 backdrop-blur-sm rounded-lg flex items-center justify-center"
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        >
          <div className="text-emerald-700 font-semibold text-lg transform hover:scale-105 transition-transform">
            Drop to Bank
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <BanknotesIcon className="w-4 h-4 text-emerald-600" />
        <h3 className="font-semibold text-gray-700 text-sm">Bank Portfolio</h3>
        <div className="ml-auto flex items-center gap-1">
          <ArrowTrendingUpIcon className="w-3 h-3 text-emerald-600" />
          <span className="font-bold text-emerald-600 text-sm">${total}M</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 grid-rows-2 gap-2">
        {denominations.map(value => (
          <div 
            key={value}
            className={`rounded-md p-1 ${
              counts[value] > 0 
                ? 'bg-emerald-50 border border-emerald-200' 
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="text-center">
              <div className={`text-sm font-bold ${
                counts[value] > 0 ? 'text-emerald-700' : 'text-gray-400'
              }`}>
                ${value}M
              </div>
              <div className={`text-xs ${
                counts[value] > 0 ? 'text-emerald-600' : 'text-gray-400'
              }`}>
                ×{counts[value]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`flex items-center ${isOpponent ? 'gap-12 flex-row-reverse' : 'gap-16'} w-full`}>
      {/* Conditional Bank and Property Set Rendering */}
      {isThreePlayer ? (
        <div className="flex gap-4 mr-8">
          {renderCompactBank()}
          <div ref={!isOpponent ? setPropertyRef : null} className="relative mt-6">
            <div className="absolute -top-6 left-0 right-0 h-8 bg-green-200/80 rounded-t-lg"></div>
            <div className="absolute -top-4 left-2 flex items-center">
              <HomeIcon className="w-4 h-4 text-green-600/70" />
            </div>
            <PropertySet 
              properties={properties}
              playerId={playerId}
              isOpponent={false}
              onDrop={handleCardDropProperty}
              setsPerRow={6}
              isCompact={true}
              className="property-set-compact main-property-set"
            />
          </div>
        </div>
      ) : (
        renderFullBank()
      )}

      {/* Cards Section */}
      <div className="flex flex-shrink">
        <div 
          className={`flex ${isOpponent ? '-space-x-24' : (isThreePlayer ? '-space-x-20' : '-space-x-14')} relative`}
          style={{ 
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          }}
          onMouseLeave={() => setHoveredCardId(null)}
        >
          <style>{`
            .card-hover-transform {
              transition: transform 250ms ease-out;
              pointer-events: none;
            }
            .card-container {
              pointer-events: auto;
              position: relative;
            }
            .card-container::after {
              content: '';
              position: absolute;
              left: 0;
              right: 0;
              bottom: -3rem;
              height: 3rem;
            }
          `}</style>
          <AnimatePresence mode="popLayout" initial={false}>
            {hand.map((card, index) => {
              const angle = isOpponent
                ? -((index - (totalCards - 1) / 2) * (fanAngleRange / Math.max(totalCards - 1, 1)))
                : 0;
                
              return (
                <motion.div
                  key={card.id}
                  className="relative"
                  layout
                  layoutId={`card-${card.id}`}
                  initial={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ 
                    opacity: 0,
                    scale: 0.8,
                    x: 100,
                    transition: { 
                      duration: 0.3,
                      ease: "easeInOut"
                    }
                  }}
                  transition={{
                    layout: {
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }
                  }}
                  style={{
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: isOpponent ? 'bottom center' : 'center',
                    zIndex: index
                  }}
                >
                  {!isOpponent ? (
                    <DraggableCard card={card}>
                      <div
                        className="transform-gpu card-hover-transform cursor-pointer card-container"
                        style={{
                          transform: hoveredCardId === card.id ? 'translateY(-3rem)' : 'none'
                        }}
                        onMouseEnter={() => setHoveredCardId(card.id)}
                        onMouseLeave={() => setHoveredCardId(null)}
                      >
                        {renderCardContent(card)}
                      </div>
                    </DraggableCard>
                  ) : (
                    <div className="transform rotate-180">
                      <CardBack width={160} height={220} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default BankAndCards;
