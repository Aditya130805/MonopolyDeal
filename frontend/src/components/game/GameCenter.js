import React from 'react';
import CardBack from '../cards/CardBack';
import CountOverlay from '../cards/CountOverlay';
import ActionCard from '../cards/ActionCard';
import { useDrop } from 'react-dnd';
import { motion, AnimatePresence } from 'framer-motion';

const GameCenter = ({ numCardsInDrawPile, lastAction, renderCardContent, ItemTypes, handleCardDrop }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.CARD,
    drop: (item) => {
      handleCardDrop(item.card);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }));

  const renderDrawPile = (cardsRemaining) => (
    <div className="relative">
      <CardBack />
      <CountOverlay count={cardsRemaining} />
    </div>
  );

  const renderActionPile = (lastAction) => (
    <div className="relative">
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
      {isOver && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-emerald-400/20 to-emerald-300/10 backdrop-blur-sm rounded-lg flex items-center justify-center"
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        >
          <div className="text-emerald-700 font-semibold text-lg transform hover:scale-105 transition-transform">
            Drop to Action
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div ref={drop} className="bg-gray-100 rounded-xl p-6 shadow-inner flex gap-6">
      {renderDrawPile(numCardsInDrawPile)}
      {renderActionPile(lastAction)}
    </div>
  );
};

export default GameCenter;
