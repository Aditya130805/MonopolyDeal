import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { BanknotesIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import CardBack from '../cards/CardBack';
import { motion, AnimatePresence } from 'framer-motion';

const BankAndCards = ({ 
  hand, 
  bank, 
  isOpponent = false, 
  ItemTypes,
  handleCardDrop,
  DraggableCard,
  renderCardContent 
}) => {
  const [hoveredCardId, setHoveredCardId] = useState(null);

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
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.CARD,
    drop: (item) => handleCardDrop(item.card),
    collect: monitor => ({
      isOver: !!monitor.isOver()
    })
  }));

  // Cards rendering calculations
  const totalCards = hand.length;
  const fanAngleRange = 20; // Total angle range for the fan effect

  return (
    <div className={`flex items-center ${isOpponent ? 'gap-12' : 'gap-16'} ${isOpponent ? '-mt-48 flex-row-reverse' : '-mb-36'} w-full`}>
      {/* Compact Bank Section with Responsive Design */}
      <div 
        ref={!isOpponent ? drop : null}
        className={`bg-white/95 rounded-lg p-3 shadow-lg ${isOpponent ? 'transform rotate-180 mt-14' : 'mt-9'} w-[300px] min-w-[250px] flex-shrink-1 relative transition-all duration-100`}
      >
        {!isOpponent && isOver && (
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
        
        {/* Grid container that switches between 6x1 and 3x2 */}
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

      {/* Cards Section */}
      <div 
        className="flex flex-shrink"
        onMouseLeave={() => setHoveredCardId(null)}
      >
        <div 
          className={`flex ${isOpponent ? '-space-x-24' : '-space-x-14'} relative`}
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
