import React from 'react';

const colorMap = {
  'brown': { bg: '#8B4513', border: '#654321', light: '#F3EBE5', text: '#8B4513' },
  'light blue': { bg: '#87CEEB', border: '#4682B4', light: '#F0FAFF', text: '#4682B4' },
  'pink': { bg: '#FF1493', border: '#C71585', light: '#FFF0F7', text: '#C71585' },
  'orange': { bg: '#FF7C2D', border: '#E65A00', light: '#FFF4F0', text: '#CC4E00' },
  'red': { bg: '#FF0000', border: '#DC143C', light: '#FFF0F0', text: '#DC143C' },
  'yellow': { bg: '#FFE026', border: '#E6BC00', light: '#FFFBF0', text: '#BF9C00' },
  'green': { bg: '#00A352', border: '#008544', light: '#F0FFF7', text: '#006837' },
  'blue': { bg: '#0055EE', border: '#0052CC', light: '#F0F7FF', text: '#003D99' },
  'mint': { bg: '#C8E0CF', border: '#ACC4B5', light: '#F2F9F4', text: '#829988' },
  'black': { bg: '#1A1A1A', border: '#000000', light: '#F8F8F8', text: '#1A1A1A' }
};

// Function to get JSON representation of the PropertyCard
export const getPropertyCardJSON = ({ id, name, color, value, rent, isWild, isUtility, isRailroad }) => {
  return {
    id,
    type: 'property',
    name,
    color: color,
    value,
    rent,
    isWild,
    isUtility,
    isRailroad
  };
};

const PropertyCard = ({ 
  name = 'Wild',
  color, // string for regular cards, array for wild cards
  value,
  rent = [], // Add default empty array for rent for wild cards
  isWild = false,
  isUtility = false,
  isRailroad = false,
  width = 160,
  height = 220,
  scale = 1 // Add scale prop for animations
}) => {

  const getColorScheme = () => {
    if (isWild) {
      const colors = color.map(c => colorMap[c.toLowerCase()]);
      if (Array.isArray(color)) {
        if (color.length > 2) {
          // All color wild card
          return {
            bg: 'bg-gradient-to-r from-[#8B4513] via-[#87CEEB] via-[#FF1493] via-[#FF7C2D] via-[#FF0000] via-[#FFE026] via-[#00A352] to-[#0055EE]',
            border: 'border-gray-400',
            text: 'text-gray-800',
            isWild: true,
            isMultiWild: true,
            colors: colors
          };
        }
        return {
          isWild: true,
          colors
        };
      }
    }

    // Regular property card
    const lowerCaseColor = typeof color === 'string' ? color.toLowerCase() : '';
    if (colorMap[lowerCaseColor]) {
      const { bg, border, light, text } = colorMap[lowerCaseColor];
      return {
        bg: `bg-[${bg}]`,
        border: `border-[${border}]`,
        light: `${light}`,
        text: `text-[${text}]`
      };
    }

    return {
      bg: 'bg-gray-400',
      border: 'border-gray-500',
      light: 'bg-gray-50',
      text: 'text-gray-600'
    };
  };

  const colors = getColorScheme();

  const getRentDescription = (index) => {
    if (!isWild) {
      if (colors.isUtility) {
        return `${index + 1} Utilit${index === 0 ? 'y' : 'ies'}`;
      }
      if (colors.isRailroad) {
        return `${index + 1} Railroad${index === 0 ? '' : 's'}`;
      }
      return `${index + 1} Card${index === 0 ? '' : 's'}`;
    }
    return '';
  };

  return (
    <div 
      className="relative"
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'center center'
      }}
    >
      {!isWild ? (
        // Regular Property Card Design
        <div className={`relative flex flex-col
          border-2 ${colors.border} rounded-lg shadow-md overflow-hidden h-full`}
          style={{ backgroundColor: colors.light }}>
          {/* Property Title Area */}
          <div className={`${colors.bg} px-3 flex flex-col items-center border-b-4 ${colors.border} h-14 relative`}>
            <div className="text-center font-bold text-white text-sm tracking-wide uppercase pl-2 flex items-center h-full">
              {name}
            </div>
            {/* Value circle overlapping the header border */}
            <div className="absolute -bottom-4 left-2 bg-white w-10 h-10 rounded-full 
              flex items-center justify-center font-bold shadow-md border-2 border-gray-200">
              <span className={`${colors.text} text-lg`}>{value}M</span>
            </div>
          </div>

          {/* Rent Information */}
          <div className={`flex-1 px-3 ${rent.length === 4 ? 'pt-1' : 'pt-6'} pb-2`}>
            <div className="flex flex-col h-full">
              <div className="space-y-1.5">
                {rent.map((amount, index) => (
                  <div key={index} 
                    className={`flex justify-between items-center bg-white/80 px-3 ${rent.length === 4 ? 'py-1' : 'py-1.5'} rounded-md text-sm shadow-sm`}>
                    <span className="text-gray-600 font-medium">{getRentDescription(index)}</span>
                    <span className={`font-bold ${colors.text} ml-2`}>{amount}M</span>
                  </div>
                ))}
              </div>
              <div className={`text-center text-xs font-medium ${colors.text} tracking-wider uppercase mt-auto pt-2`}>
                {typeof color === 'string' && color.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} SET
              </div>
            </div>
          </div>

          {/* Bottom Color Bar */}
          <div className={`${colors.bg} h-2 border-t-4 ${colors.border}`}></div>
        </div>
      ) : (
        // Wild Property Card Design
        <div className="relative flex flex-col border-2 border-gray-400 rounded-lg shadow-md overflow-hidden h-full">
          {/* Value circle */}
          <div className="absolute top-2 left-2 bg-white w-10 h-10 rounded-full 
            flex items-center justify-center font-bold shadow-md border-2 border-gray-200 z-10">
            <span className="text-gray-800 text-lg">{value}M</span>
          </div>

          {colors.isMultiWild ? (
            <>
              {/* Wild Card Badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
                {/* Horizontal Bar */}
                <div className="absolute h-1 bg-gradient-to-r from-gray-300 via-white to-gray-300 w-full shadow-sm"></div>
                {/* Center Circle */}
                <div className="relative rounded-full w-24 h-24 flex items-center justify-center shadow-lg border-2 border-gray-300 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-700">
                  {/* Rainbow Border */}
                  <div className="absolute inset-0 bg-white"></div>
                  {/* Text */}
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-500 text-lg font-extrabold tracking-wider">WILD</span>
                    <span className="text-xs font-bold">CARD</span>
                  </div>
                </div>
              </div>

              {/* Two section layout with color bars */}
              <div className="flex-1 flex flex-col bg-white">
                {/* Top Half */}
                <div className="flex-1 flex flex-col bg-blue-50">
                  {/* Color Bars */}
                  <div className="flex relative h-8 overflow-hidden">
                    {Object.entries(colorMap).slice(0, Math.ceil(Object.keys(colorMap).length / 2)).map(([colorName, color], index, arr) => (
                      <div key={colorName} className="relative flex-1">
                        {/* Base Color */}
                        <div className="absolute inset-0" style={{ backgroundColor: color.bg }}>
                          {/* Dulling overlay */}
                          <div className="absolute inset-0 bg-white/15"></div>
                        </div>
                        {/* Gradient to next color */}
                        {index < arr.length - 1 && (
                          <div 
                            className="absolute top-0 bottom-0 right-0 w-2"
                            style={{
                              background: `linear-gradient(to right, ${color.bg}, ${arr[index + 1][1].bg})`
                            }}>
                            {/* Dulling overlay for gradient */}
                            <div className="absolute inset-0 bg-white/15"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Empty Space */}
                  <div className="flex-1"></div>
                </div>

                {/* Bottom Half */}
                <div className="flex-1 flex flex-col bg-blue-50">
                  {/* Empty Space */}
                  <div className="flex-1 mt-10"></div>
                  {/* Color Bars */}
                  <div className="flex relative h-8 overflow-hidden">
                    {Object.entries(colorMap).slice(Math.ceil(Object.keys(colorMap).length / 2)).map(([colorName, color], index, arr) => (
                      <div key={colorName} className="relative flex-1">
                        {/* Base Color */}
                        <div className="absolute inset-0" style={{ backgroundColor: color.bg }}>
                          {/* Dulling overlay */}
                          <div className="absolute inset-0 bg-white/30"></div>
                        </div>
                        {/* Gradient to next color */}
                        {index < arr.length - 1 && (
                          <div 
                            className="absolute top-0 bottom-0 right-0 w-2"
                            style={{
                              background: `linear-gradient(to right, ${color.bg}, ${arr[index + 1][1].bg})`
                            }}>
                            {/* Dulling overlay for gradient */}
                            <div className="absolute inset-0 bg-white/30"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>

              {/* Wild Card Badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                {/* Horizontal Bar */}
                <div className="absolute h-1 bg-blue-100 w-full"></div>
                {/* Center Circle */}
                <div className="relative rounded-full w-20 h-20 flex items-center justify-center shadow-lg border-2 border-gray-400 overflow-hidden">
                  {/* Top Color */}
                  <div className="absolute top-0 w-full h-1/2" style={{ backgroundColor: colors.colors[0].bg }}></div>
                  {/* Bottom Color */}
                  <div className="absolute bottom-0 w-full h-1/2" style={{ backgroundColor: colors.colors[1].bg }}></div>
                  {/* Text */}
                  <div className="relative z-10 text-white text-xs font-bold text-center leading-tight drop-shadow-lg">
                    WILD<br/>CARD
                  </div>
                </div>
              </div>

              {/* Two color wild card with horizontal split */}
              <div className="flex-1 flex flex-col bg-white">
                {/* First Color Half */}
                <div className="flex-1 flex flex-col bg-blue-50">
                  {/* Color Name Bar */}
                  <div className="text-center text-xs font-bold text-white py-3" style={{ backgroundColor: colors.colors[0].bg }}>
                    {color[0].split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </div>
                  {/* Rent Values */}
                  <div className="flex-1 p-3">
                    <div className="flex gap-1 justify-center">
                      {/* {colors.colors[0].rent.map((amount, index) => (
                        <div key={index} 
                          className="bg-gray-100 px-1 py-1 rounded text-center text-sm font-bold">
                          {amount}M
                        </div>
                      ))} */}
                    </div>
                  </div>
                </div>

                {/* Second Color Half */}
                <div className="flex-1 flex flex-col bg-blue-50">
                  {/* Rent Values */}
                  <div className="flex-1 mt-10">
                    <div className="flex gap-1 justify-center">
                      {/* {colors.colors[1].rent.map((amount, index) => (
                        <div key={index} 
                          className="bg-gray-100 px-1 py-1 rounded text-center text-sm font-bold">
                          {amount}M
                        </div>
                      ))} */}
                    </div>
                  </div>
                  {/* Color Name Bar */}
                  <div className="text-center text-xs font-bold text-white py-3" style={{ backgroundColor: colors.colors[1].bg }}>
                    {color[1].split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </div>
                </div>
              </div>            
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyCard;
