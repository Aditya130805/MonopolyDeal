import React from 'react';
import CardBack from '../cards/CardBack';
import CountOverlay from '../cards/CountOverlay';
import ActionCard from '../cards/ActionCard';

const GameCenter = ({ numCardsInDrawPile, lastAction, renderCardContent }) => {
  const renderDrawPile = (cardsRemaining) => (
    <div className="relative">
      <CardBack />
      <CountOverlay count={cardsRemaining} />
    </div>
  );

  const renderActionPile = (lastAction) => (
    <div className="w-[140px] h-[190px] bg-white border-gray-700 rounded-lg shadow-md flex flex-col justify-center items-center">
      {lastAction ? (
        <ActionCard
          key={lastAction.type}
          name={lastAction.name}
          width={140}
          height={190}
          rentColors={lastAction.colors}
        />
      ) : (
        <div className="text-gray-600 text-center">
          <div>No cards</div>
          <div>played yet</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-gray-100 rounded-xl p-6 shadow-inner flex gap-6">
      {renderDrawPile(numCardsInDrawPile)}
      {renderActionPile(lastAction)}
    </div>
  );
};

export default GameCenter;
