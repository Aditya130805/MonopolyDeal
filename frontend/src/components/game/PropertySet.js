import React from 'react';
import { HomeIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { useDroppable } from '@dnd-kit/core';
import { setRequirements } from '../../utils/gameUtils';

const PropertySet = ({ properties, isOpponent = false, onDrop, setsPerRow = 4, isCompact = false, className = '' }) => {
  // properties is already grouped by color, no need to reduce
  const propertyGroups = properties || {};
  const colorOrder = ['brown', 'mint', 'blue', 'light blue', 'pink', 'orange', 'red', 'yellow', 'green', 'black'];

  const { setNodeRef, isOver } = !isOpponent && onDrop ? useDroppable({
    id: 'property-main'
  }) : { setNodeRef: null, isOver: false };

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

  const renderPropertyCard = (color, cards, requiredCards, colorStyle, lightColorStyle) => {
    const propertyCards = cards && cards.filter(card => card.type === 'property');
    const isComplete = propertyCards && propertyCards.length >= requiredCards;
    const houseCard = cards && cards.find(card => card.type === 'action' && card.name.toLowerCase() === 'house');
    const hotelCard = cards && cards.find(card => card.type === 'action' && card.name.toLowerCase() === 'hotel');

    return (
      <div key={color} className={`relative ${isCompact ? 'w-[34px] h-[51px]' : 'w-[40px] h-[60px]'} group`}>
        <div className={`w-full h-full rounded-sm border border-black/40 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden`}> 
          <div className="flex flex-col h-full">
            {[...Array(requiredCards)].map((_, index) => {
              const hasCard = propertyCards && index < propertyCards.length;
              const card = hasCard ? propertyCards[index] : null;
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
        {/* Houses and Hotels */}
        {isComplete && (
          <div className={`absolute -top-2 -right-2 flex items-center space-x-1 ${isCompact ? 'scale-75 -top-1 -right-1' : ''}`}>
            {houseCard && (
              <div className="bg-white rounded-full p-0.5 shadow-md">
                <HomeIcon className={`${isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-green-600`} />
              </div>
            )}
            {hotelCard && (
              <div className="bg-white rounded-full p-0.5 shadow-md">
                <BuildingOffice2Icon className={`${isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-red-600`} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Split the colors into rows based on setsPerRow
  const createRows = () => {
    const rows = [];
    const allColors = [...colorOrder]; // Get all colors
    const overflowColors = Object.keys(overflowSets);
    const seenColors = new Set();
    
    // Add overflow colors if they're not already in the color order
    overflowColors.forEach(color => {
      allColors.push(color);
    });
    
    // Create rows of equal size based on setsPerRow
    for (let i = 0; i < allColors.length; i += setsPerRow) {
      const rowColors = allColors.slice(i, i + setsPerRow);
      rows.push(
        <div key={i} className="flex gap-2">
          {rowColors.map(color => {
            const isOverflow = seenColors.has(color);
            seenColors.add(color);
            
            return renderPropertyCard(
              isOverflow ? `${color}-overflow` : color,
              isOverflow ? overflowSets[color] : mainSets[color],
              setRequirements[color],
              colorStyles[color],
              lightColorStyles[color]
            );
          })}
        </div>
      );
    }
    
    return rows;
  };

  return (
    <div className={`inline-block`}>
      <div ref={setNodeRef} className={`bg-white/90 rounded-lg shadow-lg p-3 relative property-set ${className}`}>
        {!isOpponent && isOver && (
          <div 
            className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-emerald-400/20 to-emerald-300/10 backdrop-blur-sm rounded-lg flex items-center justify-center pointer-events-none z-50"
            style={{
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          >
            <div className="text-emerald-700 font-semibold text-lg transform hover:scale-105 transition-transform">
              Drop to Property
            </div>
          </div>
        )}
        {/* Heading */}
        {!isCompact && <div className="flex items-center gap-2 mb-2">
          <HomeIcon className="w-4 h-4 text-emerald-600" />
          <h3 className="font-semibold text-gray-700 text-sm">Property Portfolio</h3>
        </div>}

        {/* Property Cards Grid */}
        <div className="flex flex-col gap-2">
          {createRows()}
        </div>
      </div>
    </div>
  );
};

export default PropertySet;
