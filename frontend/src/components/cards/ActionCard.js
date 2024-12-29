import React from 'react';

const ActionCard = ({ 
  name,
  width = 160, 
  height = 220, 
  rentColors = []
}) => {
  // Calculate proportional sizes based on the card dimensions
  const calculateSizes = () => {
    const baseWidth = 160; 
    const scale = width / baseWidth;
    
    return {
      fontSize: {
        xs: `${scale * 0.75}rem`,  
        sm: `${scale * 0.875}rem`, 
        base: `${scale * 1}rem`,   
        lg: `${scale * 1.125}rem`  
      },
      spacing: {
        circle: `${scale * 2.5}rem`,     
        padding: `${scale * 0.25}rem ${scale * 0.5}rem`, 
        margin: `${scale * 3.5}rem`      
      }
    };
  };

  const sizes = calculateSizes();

  const getColorClass = (colorName) => {
    switch (colorName.toLowerCase()) {
      case 'brown': return 'bg-[#8B4513]';
      case 'light blue': return 'bg-[#87CEEB]';
      case 'pink': return 'bg-[#FF1493]';
      case 'orange': return 'bg-[#FF7C2D]';
      case 'red': return 'bg-[#FF0000]';
      case 'yellow': return 'bg-[#FFE026]';
      case 'green': return 'bg-[#00A352]';
      case 'blue': return 'bg-[#0055EE]';
      case 'mint': return 'bg-[#C8E0CF]';
      case 'black': return 'bg-[#1A1A1A]';
      default: return 'bg-gray-400';
    }
  };

  // Card data mapping
  const getCardData = () => {
    const cardName = name.toLowerCase();

    // Handle other action cards
    switch (cardName) {
      case 'multicolor rent':
        return {
          value: 3,
          description: 'Collect rent from ONE player for any property'
        };
        break;
      case 'rent':
        return {
          value: 1,
          description: `Collect rent from all players for any of the two colors`
        };
        break;
      case 'deal breaker':
        return {
          value: 5,
          description: 'Steal a complete property set from any player'
        };
        break;
      case 'forced deal':
        return {
          value: 3,
          description: 'Swap any property with another player'
        };
        break;
      case 'sly deal':
        return {
          value: 3,
          description: 'Steal a property card from any player'
        };
        break;
      case 'debt collector':
        return {
          value: 3,
          description: 'Force any player to pay you 5M'
        };
        break;
      case 'double the rent':
        return {
          value: 1,
          description: 'Use with a Rent card to double the rent value'
        };
        break;
      case 'it\'s your birthday':
        return {
          value: 2,
          description: 'All players must pay you 2M as a birthday gift'
        };
        break;
      case 'pass go':
        return {
          value: 1,
          description: 'Draw 2 extra cards from the deck'
        };
        break;
      case 'house':
        return {
          value: 3,
          description: 'Add to a full property set to add 3M to the rent value'
        };
        break;
      case 'hotel':
        return {
          value: 4,
          description: 'Add to a full property set with a house to add 4M to the rent value'
        };
        break;
      case 'just say no':
        return {
          value: 4,
          description: 'Cancel an action card played against you'
        };
        break;
      default:
        return {
          value: 0,
          description: 'Action card description'
        };
    }
  };

  // Color scheme for action cards - purple with accents
  const getColorScheme = () => {
    const baseColors = {
      bg: 'bg-purple-50',
      border: 'border-purple-400',
      text: 'text-purple-900'
    };

    return baseColors;
  };

  const colors = getColorScheme();
  const cardData = getCardData();

  // Helper function to get the background color from border color
  const getBgFromBorder = (borderClass) => {
    return 'bg-purple-500'; // Purple for action label
  };

  return (
    <div 
      className={`relative flex flex-col ${colors.bg}
        border-2 ${colors.border} rounded-lg shadow-md overflow-hidden`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Large Lightning Icon Background */}
      {/* <div className="absolute inset-0 flex items-center justify-center opacity-15">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-48 h-48 text-purple-400 transform rotate-12`}
    >
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div> */}

      {/* Value circle in top left */}
      <div className={`absolute top-2 left-2 w-10 h-10 ${colors.border} bg-white rounded-full 
        flex items-center justify-center font-bold shadow-md border-2`}>
        <span className="text-purple-500 text-lg">{cardData.value}M</span>
      </div>

      {/* Action Label in top right */}
      <div 
        className={`absolute top-2 right-2 ${getBgFromBorder(colors.border)}
          rounded-lg text-xs font-bold tracking-wider uppercase text-white
          shadow-sm`}
        style={{ padding: sizes.spacing.padding }}
      >
        Action
      </div>

      {/* Card Title with enhanced emphasis */}
      <div className="mt-14 px-3 text-center">
        <div className="relative inline-block">
          <div className="bg-white absolute inset-0 rounded"></div>
          <div className={`text-purple-500 relative font-extrabold tracking-wider uppercase
            py-1 px-2 rounded shadow-sm border border-purple-400/20 flex items-center gap-2
            ${width <= 140 ? 'text-xs' : 'text-md'}`}>
            {name}
            {name.toLowerCase() === 'rent' && rentColors && rentColors.length > 0 && (
              <div className="flex h-4 w-8 rounded overflow-hidden">
                {rentColors.map((color, index) => (
                  <div 
                    key={color} 
                    className={`${getColorClass(color)} flex-1`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Description */}
      <div className="flex-1 px-3 py-2">
        <div 
          className="text-purple-700 text-center font-bold"
          style={{ fontSize: sizes.fontSize.xs }}
        >
          {cardData.description}
        </div>
      </div>

      {/* Bottom Label */}
      <div 
        className="border-purple-400 py-1.5 text-center font-bold tracking-wider uppercase text-purple-500"
        style={{ fontSize: sizes.fontSize.xs }}
      >
        Action Card
      </div>
    </div>
  );
};

export default ActionCard;
