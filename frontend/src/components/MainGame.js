import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './auth/Navbar';
import CardBack from './cards/CardBack';
import CountOverlay from './cards/CountOverlay';
import MoneyCard from './cards/MoneyCard';
import PropertyCard from './cards/PropertyCard';
import ActionCard from './cards/ActionCard';
import {
  HandIcon,
  BanknotesIcon,
  HomeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const MainGame = () => {
  const { roomId } = useParams();
  const { socket } = useWebSocket();
  const { user } = useAuth();
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Mock data for demonstration
  const playerHand = [
    { 
      id: 1, 
      type: 'property', 
      color: ['green', 'black'],
      value: 1,
      isWild: true
    },
    { 
      id: 2, 
      type: 'property', 
      name: 'Oriental Avenue',
      color: 'light-blue',
      value: 1
    },
    { 
      id: 3, 
      type: 'property',
      color: ['brown', 'light-blue', 'pink', 'orange', 'red', 'yellow', 'green', 'blue', 'black'],
      value: 2,
      isWild: true
    },
    { 
      id: 4, 
      type: 'property', 
      name: 'St. James Place',
      color: 'orange',
      value: 2
    },
    { id: 5, type: 'money', value: 10 },
    { id: 6, type: 'money', value: 5 },
    { id: 7, type: 'money', value: 1 },
    {
      id: 8,
      type: 'action',
      name: 'Deal Breaker'
    },
    {
      id: 9,
      type: 'action',
      name: 'Forced Deal'
    },
    {
      id: 10,
      type: 'action',
      name: 'Sly Deal'
    },
    {
      id: 11,
      type: 'action',
      name: 'Debt Collector'
    }
  ];
  
  const opponentHand = [
    { id: 12, type: 'money', value: 10 },
    { id: 13, type: 'money', value: 5 },
    {
      id: 14,
      type: 'action',
      name: 'Double Rent'
    },
    { id: 15, type: 'money', value: 4 },
    {
      id: 16,
      type: 'action',
      name: 'Pass Go'
    }
  ];

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

  const renderCardContent = (card) => {
    switch (card.type) {
      case 'money':
        return <MoneyCard value={card.value} />;
      case 'property':
        return (
          <PropertyCard
            name={card.name}
            color={card.color}
            value={card.value}
            rent={card.rent}
            isWild={card.isWild}
          />
        );
      case 'action':
        return (
          <ActionCard
            key={card.id}
            name={card.name}
          />
        );
      default:
        return (
          <div className="w-[160px] h-[220px] bg-white border-2 border-gray-700 rounded-lg shadow-md 
            flex flex-col justify-center items-center">
            <div className="font-semibold mb-2">{card.type}</div>
            <div>{card.value}</div>
          </div>
        );
    }
  };

  const renderCards = (cards, isPlayer = false) => {
    const totalCards = cards.length;
    const fanAngleRange = 20; // Total angle range for the fan
    
    return (
      <div className={`flex justify-center items-center ${isPlayer ? '-mb-36' : '-mt-48'}`}>
        <div className={`flex ${isPlayer ? '-space-x-14' : '-space-x-24'} relative`}>
          {cards.map((card, index) => {
            // Calculate fan angle only for opponent's cards
            const angleOffset = !isPlayer 
              ? -((index - (totalCards - 1) / 2) * (fanAngleRange / (totalCards - 1)))
              : 0;
              
            return (
              <div
                key={card.id}
                className="relative"
                style={{
                  zIndex: hoveredCard === card.id ? 50 : index   // Switch to 50 : index to bring the card to front 
                }}
                onMouseEnter={() => isPlayer && setHoveredCard(card.id)}
                onMouseLeave={() => isPlayer && setHoveredCard(null)}
              >
                <div
                  className="transition-all duration-200"
                  style={{
                    transform: `rotate(${angleOffset}deg) translateY(${hoveredCard === card.id ? '-50px' : '0'})`,
                    transformOrigin: !isPlayer ? 'top center' : 'center'
                  }}
                >
                  {isPlayer ? (
                    renderCardContent(card)
                  ) : (
                    <div className={`transform rotate-[${-angleOffset}deg] text-center`}>
                      <CardBack width={160} height={220} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Game Layout */}
      <div className="flex flex-col justify-between h-[calc(100vh-4rem)] py-32 px-8 overflow-hidden">
        {/* Opponent's Area */}
        <div className="w-full">
          {renderCards(opponentHand)}
        </div>

        {/* Center Area */}
        <div className="w-full flex justify-center items-center">
          <div className="bg-gray-100 rounded-xl p-6 shadow-inner flex gap-6">
            {renderDrawPile(42)} {/* Example number of remaining cards */}
            {renderActionPile({ type: 'Action', name: 'Multicolor Rent', colors: ['black', 'mint'] })} {/* Example last action */}
          </div>
        </div>
        
        {/* Player's Area */}
        <div className="w-full">
          {renderCards(playerHand, true)}
        </div>
      </div>
    </div>
  );
};

export default MainGame;
