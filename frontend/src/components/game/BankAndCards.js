import React from 'react';
import { useDrop } from 'react-dnd';
import { BanknotesIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import CardBack from '../cards/CardBack';

const BankAndCards = ({ 
  hand, 
  bank, 
  isOpponent = false, 
  ItemTypes,
  handleCardDrop,
  DraggableCard,
  renderCardContent 
}) => {
  // Bank calculations
  const moneyCards = bank;
  const denominations = [1, 2, 3, 4, 5, 10];
  const counts = denominations.reduce((acc, val) => {
    acc[val] = moneyCards.filter(card => card.value === val).length;
    return acc;
  }, {});
  const total = moneyCards.reduce((sum, card) => sum + card.value, 0);

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
    <div className={`flex items-center ${isOpponent ? 'gap-12' : 'gap-4'} ${isOpponent ? '-mt-48 flex-row-reverse' : '-mb-36'} w-full`}>
      {/* Compact Bank Section with Responsive Design */}
      <div 
        ref={!isOpponent ? drop : null}
        className={`bg-white/95 rounded-lg p-3 shadow-lg ${isOpponent ? 'transform rotate-180 mt-14' : 'mt-9'} w-[300px] min-w-[250px] flex-shrink-1 relative transition-all duration-300`}
      >
        {!isOpponent && isOver && (
          <div 
            className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-emerald-400/20 to-emerald-300/10 backdrop-blur-sm rounded-lg flex items-center justify-center"
            style={{
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          >
            <div className="text-emerald-700 font-semibold text-lg transform hover:scale-105 transition-transform">
              Drop to Bank It
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
      <div className="flex flex-shrink">
        <div className={`flex ${isOpponent ? '-space-x-24' : '-space-x-14'} relative`}>
          {hand.map((card, index) => {
            // Calculate the angle for each card in the fan
            const angle = isOpponent
              ? -((index - (totalCards - 1) / 2) * (fanAngleRange / Math.max(totalCards - 1, 1)))
              : 0;
              
            return (
              <div
                key={card.id}
                className="relative"
                style={{
                  zIndex: index,
                  transform: isOpponent ? `rotate(${angle}deg)` : 'none',
                  transformOrigin: isOpponent ? 'bottom center' : 'center',
                  WebkitTransform: isOpponent ? `rotate(${angle}deg)` : 'none',
                  WebkitTransformOrigin: isOpponent ? 'bottom center' : 'center'
                }}
              >
                {!isOpponent ? (
                  <DraggableCard card={card}>
                    <div
                      className="transition-transform duration-300 ease-in-out hover:-translate-y-12 transform"
                      style={{
                        willChange: 'transform'
                      }}
                    >
                      {renderCardContent(card)}
                    </div>
                  </DraggableCard>
                ) : (
                  <div className="transform rotate-180">
                    <CardBack width={160} height={220} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BankAndCards;
