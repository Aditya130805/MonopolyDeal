import React from 'react';

const CardBack = ({ width = 140, height = 190 }) => {
  return (
    <div 
      className="relative bg-[#2d5a3c] border-2 border-[#1a472a] rounded-lg shadow-md"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-[radial-gradient(#b0fbb0_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="font-bold text-[#b0fbb0] text-lg tracking-wide">CARDOPOLY</div>
          {/* <div className="text-[#a8f9a8] mt-1 font-medium tracking-wider">DEAL</div> */}
        </div>
      </div>
      {/* Decorative corners */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#b0fbb0]/30"></div>
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#b0fbb0]/30"></div>
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#b0fbb0]/30"></div>
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#b0fbb0]/30"></div>
    </div>
  );
};

export default CardBack;
