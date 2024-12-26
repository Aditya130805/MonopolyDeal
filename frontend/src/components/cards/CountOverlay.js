import React from 'react';

const CountOverlay = ({ count }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white shadow-lg px-4 py-2 rounded-lg border border-emerald-200 transform -rotate-6">
        <span className="text-2xl font-bold bg-gradient-to-br from-emerald-700 to-emerald-900 text-transparent bg-clip-text">
          {count}
        </span>
      </div>
    </div>
  );
};

export default CountOverlay;
