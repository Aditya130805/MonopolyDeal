import React from 'react';
import { HomeIcon } from '@heroicons/react/24/outline';

const PropertySet = ({ properties, isOpponent = false, setRequirements, colorOrder }) => {
  // properties is already grouped by color, no need to reduce
  const propertyGroups = properties || {};

  // Split properties into main sets and overflow
  const mainSets = {};
  const overflowSets = {};

  // Process properties and split into main/overflow
  Object.entries(propertyGroups).forEach(([color, cards]) => {
    if (!Array.isArray(cards)) {
      mainSets[color] = [];
      return;
    }

    const propertyCards = cards.filter(card => card && card.type === 'property');
    const requiredCards = setRequirements[color] || 0;
    
    if (propertyCards.length <= requiredCards) {
      mainSets[color] = propertyCards;
    } else {
      mainSets[color] = propertyCards.slice(0, requiredCards);
      overflowSets[color] = propertyCards.slice(requiredCards);
    }
  });

  const colorStyles = {
    'brown': 'bg-amber-800',
    'light blue': 'bg-sky-300',
    'pink': 'bg-pink-300',
    'orange': 'bg-orange-400',
    'red': 'bg-red-500',
    'yellow': 'bg-yellow-300',
    'green': 'bg-green-600',
    'blue': 'bg-blue-600',
    'black': 'bg-gray-800',
    'mint': 'bg-emerald-200'
  };

  const lightColorStyles = {
    'brown': 'bg-gray-200',
    'light blue': 'bg-gray-200',
    'pink': 'bg-gray-200',
    'orange': 'bg-gray-200',
    'red': 'bg-gray-200',
    'yellow': 'bg-gray-200',
    'green': 'bg-gray-200',
    'blue': 'bg-gray-200',
    'black': 'bg-gray-200',
    'mint': 'bg-gray-200'
  };

  const renderPropertyCard = (color, cards, requiredCards, colorStyle, lightColorStyle) => (
    <div key={color} className="relative w-[40px] h-[60px] group">
      <div className={`w-full h-full rounded-sm border border-black/40 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden`}>
        <div className="flex flex-col h-full">
          {[...Array(requiredCards)].map((_, index) => {
            const hasCard = cards && index < cards.length;
            const card = hasCard ? cards[index] : null;
            return (
              <div
                key={index}
                className={`
                  flex-1 
                  border-b 
                  border-black/40 
                  last:border-b-0 
                  ${hasCard ? colorStyle : lightColorStyle}
                  transition-all 
                  duration-200
                  group-hover:brightness-105
                  relative
                `}
                title={hasCard ? card.name : `Empty ${color} slot`}
              >
                {hasCard && card.isWild && (
                  <div className="absolute inset-0 flex">
                    {/* Main color takes 75% */}
                    <div className={`w-3/4 ${colorStyle}`} />
                    {/* Wild colors take 25% */}
                    <div className="w-1/4 flex flex-col">
                      {card.color
                        .filter(wildColor => wildColor !== card.currentColor) // Filter out the active color
                        .map((wildColor, i) => (
                          <div 
                            key={i} 
                            className={`flex-1 ${colorStyles[wildColor]} opacity-80`}
                          />
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Get overflow colors that need to be rendered
  const overflowColors = Object.keys(overflowSets);

  // Calculate what goes in the last row
  const lastRowColors = [...colorOrder.slice(8)];

  return (
    <div className={`inline-block ${isOpponent ? 'transform rotate-180' : ''}`}>
      <div className="bg-white/90 rounded-lg shadow-lg p-3">
        {/* Heading */}
        <div className="flex items-center gap-2 mb-2">
          <HomeIcon className="w-4 h-4 text-emerald-600" />
          <h3 className="font-semibold text-gray-700 text-sm">Property Portfolio</h3>
        </div>

        {/* Property Cards Grid */}
        <div className="flex flex-col gap-2">
          {/* First row of 4 */}
          <div className="flex gap-2 justify-start">
            {colorOrder.slice(0, 4).map(color => 
              renderPropertyCard(color, mainSets[color], setRequirements[color], colorStyles[color], lightColorStyles[color])
            )}
          </div>
          {/* Second row of 4 */}
          <div className="flex gap-2 justify-start">
            {colorOrder.slice(4, 8).map(color => 
              renderPropertyCard(color, mainSets[color], setRequirements[color], colorStyles[color], lightColorStyles[color])
            )}
          </div>
          {/* Third row - base cards + overflow */}
          <div className="flex gap-2 justify-start">
            {lastRowColors.map((color, index) => {
              if (index < colorOrder.slice(8).length) {
                return renderPropertyCard(
                  color, 
                  mainSets[color], 
                  setRequirements[color], 
                  colorStyles[color], 
                  lightColorStyles[color]
                );
              }
              return renderPropertyCard(
                `${color}-overflow-${index}`, 
                [overflowSets[color][index - colorOrder.slice(8).length]],
                setRequirements[color],
                colorStyles[color],
                lightColorStyles[color]
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertySet;
