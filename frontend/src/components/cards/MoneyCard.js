import React from 'react';

// Function to get JSON representation of the MoneyCard
export const getMoneyCardJSON = ({ id, value }) => {
  return {
    type: 'money',
    id: id,
    value: value
  };
};

const MoneyCard = ({ value, width = 160, height = 220, scale = 1 }) => {
  // Simple color scheme based on value
  const getColorSchemeColored = () => {
    switch (value) {
      case 1: return {
        bg: 'bg-orange-50',
        border: 'border-orange-400',
        accent: 'text-orange-500',
        circle: 'bg-orange-500'
      };
      case 2: return {
        bg: 'bg-blue-50',
        border: 'border-blue-400',
        accent: 'text-blue-500',
        circle: 'bg-blue-500'
      };
      case 3: return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-400',
        accent: 'text-emerald-500',
        circle: 'bg-emerald-500'
      };
      case 4: return {
        bg: 'bg-purple-50',
        border: 'border-purple-400',
        accent: 'text-purple-500',
        circle: 'bg-purple-500'
      };
      case 5: return {
        bg: 'bg-red-50',
        border: 'border-red-400',
        accent: 'text-red-500',
        circle: 'bg-red-500'
      };
      default: return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-400',
        accent: 'text-yellow-500',
        circle: 'bg-yellow-500'
      }; // 10M
    }
  };

  const getColorScheme = () => {
    // Use a consistent blue theme
    const baseColors = {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      accent: 'text-blue-500',
      circle: 'bg-blue-500'
    };

    // Return same colors for all cards to maintain theme
    return baseColors;
  };

  const colors = getColorScheme();

  return (
    <div 
      className={`relative flex flex-col items-center justify-center ${colors.bg} 
        border-2 ${colors.border} rounded-lg shadow-md overflow-hidden`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'center center'
      }}
    >
      {/* Value circle in top left */}
      <div className={`absolute top-2 left-2 ${colors.circle} w-12 h-8 rounded-full 
        flex items-center justify-center text-white font-bold shadow-sm`}>
        {value}
      </div>

      {/* Subtle corner decorations
      <div className={`absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 ${colors.border} rounded-tl-lg opacity-50`}></div>
      <div className={`absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 ${colors.border} rounded-tr-lg opacity-50`}></div>
      <div className={`absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 ${colors.border} rounded-bl-lg opacity-50`}></div>
      <div className={`absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 ${colors.border} rounded-br-lg opacity-50`}></div> */}

      {/* Main content */}
      <div className="text-center">
        <div className="text-4xl font-bold text-gray-800">{value}M</div>
        <div className={`text-lg font-medium tracking-wide ${colors.accent}`}>MILLION</div>
      </div>
    </div>
  );
};

export default MoneyCard;
