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
  BanknotesIcon,
  ArrowTrendingUpIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

const MainGame = () => {  
  const { roomId } = useParams();
  const { socket } = useWebSocket();
  const { user } = useAuth();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [playerHand, setPlayerHand] = useState([]);
  const [playerBank, setPlayerBank] = useState([]);
  const [playerProperties, setPlayerProperties] = useState({});
  const [opponentHand, setOpponentHand] = useState([]);
  const [opponentBank, setOpponentBank] = useState([]);
  const [opponentProperties, setOpponentProperties] = useState({});
  const [numCardsInDrawPile, setNumCardsInDrawPile] = useState([]);
  const [lastAction, setLastAction] = useState(null);

  const colorOrder = [
    // First row - 4 properties
    'black',   // [1, 2, 3, 4]
    'mint',    // [1, 2]
    'brown',   // [1, 2]
    'blue',    // [3, 8]

    // Second row - 4 properties
    'light blue', // [1, 2, 3]
    'pink',      // [1, 2, 4]
    'orange',    // [1, 3, 5]
    'red',       // [2, 3, 6]

    // Third row - 2 properties
    'yellow',    // [2, 4, 6]
    'green'      // [2, 4, 7]
  ];

  // Number of cards needed for a complete set
  const setRequirements = {
    // 2 property sets
    'mint': 2,    // [1, 2]
    'brown': 2,   // [1, 2]
    'blue': 2,    // [3, 8]

    // 3 property sets
    'light blue': 3, // [1, 2, 3]
    'pink': 3,      // [1, 2, 4]
    'orange': 3,    // [1, 3, 5]
    'red': 3,       // [2, 3, 6]
    'yellow': 3,    // [2, 4, 6]
    'green': 3,     // [2, 4, 7]

    // 4 property set
    'black': 4      // [1, 2, 3, 4]
  };

  useEffect(() => {
    if (!socket) {
        console.log("Socket is null; waiting for WebSocket connection.");
        return;
    }
    console.log("(Socket 2) Connected:", socket);
    socket.onmessage = handleMessage;
    setTimeout(() => setIsSocketReady(true), 0);
  }, [socket]);

  useEffect(() => {
    if (isSocketReady) {
      socket.send(JSON.stringify({
        action: 'initial_game_state',
        player_name: user.username
      }));
    }
  }, [isSocketReady]);

  const handleMessage = (event) => {
    try {
      console.log(`(Handler 2) WebSocket message in room ${roomId}:`, event.data);
      const data = JSON.parse(event.data);
      if (data.type && data.type === 'game_update') {
        const gameState = data.state;
        console.log("STATE:", gameState);
        
        // Find current player and update their hand
        console.log(gameState.players);
        const currentPlayer = gameState.players.find(p => p.id === user.unique_id);
        if (currentPlayer) {
          setPlayerHand(currentPlayer.hand);
          setPlayerBank(currentPlayer.bank);
          setPlayerProperties(currentPlayer.properties);
        }
        // Find opponents and update their hands
        const opponents = gameState.players.filter(p => p.id !== user.unique_id);
        const opponentCards = opponents.flatMap(opponent => opponent.hand);
        const opponentBanks = opponents.flatMap(opponent => opponent.bank);
        const opponentProperties = opponents.flatMap(opponent => opponent.properties);
        setOpponentHand(opponentCards);
        setOpponentBank(opponentBanks);
        setOpponentProperties(opponentProperties);
        setNumCardsInDrawPile(gameState.deck_count);
        setLastAction(gameState.discard_pile ? gameState.discard_pile[gameState.discard_pile.length - 1] : null);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  const renderBankAndCards = (hand, bank, isOpponent = false) => {
    // Bank calculations
    const moneyCards = bank;
    const denominations = [1, 2, 3, 4, 5, 10];
    const counts = denominations.reduce((acc, val) => {
      acc[val] = moneyCards.filter(card => card.value === val).length;
      return acc;
    }, {});
    const total = moneyCards.reduce((sum, card) => sum + card.value, 0);

    // Cards rendering calculations
    const totalCards = hand.length;
    const fanAngleRange = 20;

    return (
      <div className={`flex items-center ${isOpponent ? 'gap-12' : 'gap-4'} ${isOpponent ? '-mt-48 flex-row-reverse' : '-mb-36'} w-full`}>
        {/* Compact Bank Section with Responsive Design */}
        <div className={`bg-white/95 rounded-lg p-3 shadow-lg ${isOpponent ? 'transform rotate-180 mt-14' : 'mt-9'} w-[300px] min-w-[250px] flex-shrink-1`}>
          <div className="flex items-center gap-2 mb-2">
            <BanknotesIcon className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-gray-700 text-sm">Bank Portfolio</h3>
            <div className="ml-auto flex items-center gap-1">
              <ArrowTrendingUpIcon className="w-3 h-3 text-emerald-600" />
              <span className="font-bold text-emerald-600 text-sm">${total}M</span>
            </div>
          </div>
          
          {/* Grid container that switches between 6x1 and 3x2 */}
          <div className="grid grid-cols-3 grid-rows-2 gap-2">
            {denominations.map(value => (
              <div 
                key={value}
                className={`rounded-md p-1 ${
                  counts[value] > 0 
                    ? 'bg-emerald-50 border border-emerald-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="text-center">
                  <div className={`text-sm font-bold ${
                    counts[value] > 0 ? 'text-emerald-700' : 'text-gray-400'
                  }`}>
                    ${value}M
                  </div>
                  <div className={`text-xs ${
                    counts[value] > 0 ? 'text-emerald-600' : 'text-gray-400'
                  }`}>
                    ×{counts[value]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cards Section */}
        <div className="flex flex-shrink">
          <div className={`flex ${isOpponent ? '-space-x-24' : '-space-x-14'} relative`}>
            {hand.map((card, index) => {
              const angleOffset = !isOpponent
                ? 0
                : -((index - (totalCards - 1) / 2) * (fanAngleRange / (totalCards - 1)));
                
              return (
                <div
                  key={card.id}
                  className="relative"
                  style={{
                    zIndex: hoveredCard === card.id ? 50 : index
                  }}
                  onMouseEnter={() => isOpponent ? null : setHoveredCard(card.id)}
                  onMouseLeave={() => isOpponent ? null : setHoveredCard(null)}
                >
                  <div
                    className="transition-all duration-200"
                    style={{
                      transform: `rotate(${angleOffset}deg) translateY(${hoveredCard === card.id ? '-50px' : '0'})`,
                      transformOrigin: !isOpponent ? 'center' : 'top center'
                    }}
                  >
                    {!isOpponent ? (
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
      </div>
    );
  };

  const renderPropertySet = (properties, isOpponent = false) => {
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
    overflowColors.forEach(color => {
      const overflowCards = overflowSets[color];
      overflowCards.forEach(card => {
        lastRowColors.push(color); // Add each overflow card as a separate item
      });
    });

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
            <div className="flex gap-2">
              {colorOrder.slice(0, 4).map(color => 
                renderPropertyCard(color, mainSets[color], setRequirements[color], colorStyles[color], lightColorStyles[color])
              )}
            </div>
            {/* Second row of 4 */}
            <div className="flex gap-2">
              {colorOrder.slice(4, 8).map(color => 
                renderPropertyCard(color, mainSets[color], setRequirements[color], colorStyles[color], lightColorStyles[color])
              )}
            </div>
            {/* Third row - base cards + overflow */}
            <div className="flex gap-2 justify-center">
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
            rentColors={card.rentColors || []}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Game Layout */}
      <div className="flex flex-col justify-between h-[calc(100vh-4rem)] py-32 px-8 overflow-hidden">
        {/* Opponent's Area */}
        <div className="w-full">
          {renderBankAndCards(opponentHand, opponentBank, true)}
        </div>

        {/* Center Area with Property Sets */}
        <div className="w-full flex justify-between items-center gap-6">
          {/* Left Property Set */}
          <div className="flex-1">
            {renderPropertySet(playerProperties)}
            {/* {renderPropertySet({
              'yellow': [{
                type: 'property',
                id: 19,
                name: 'Marvin Gardens',
                color: 'yellow',
                currentColor: 'yellow',
                value: 3,
                isWild: false
              }, {
                type: 'property',
                id: 20,
                name: 'Ventnor Avenue',
                color: 'yellow',
                currentColor: 'yellow',
                value: 3,
                isWild: false
              }, {
                type: 'property',
                id: 21,
                name: 'Wild Property',
                color: ['red', 'yellow', 'green'],
                currentColor: 'yellow',
                value: 0,
                isWild: true,
              }],
              'red': [{
                type: 'property',
                id: 22,
                name: 'Kentucky Avenue',
                color: 'red',
                currentColor: 'red',
                value: 3,
                isWild: false
              }, {
                type: 'property',
                id: 23,
                name: 'Wild Property',
                color: ['red', 'brown', 'mint', 'light blue', 'pink', 'orange', 'yellow', 'green', 'blue', 'black'],
                currentColor: 'red',
                value: 0,
                isWild: true
              }],
              'green': [{
                type: 'property',
                id: 24,
                name: 'Pacific Avenue',
                color: 'green',
                currentColor: 'green',
                value: 3,
                isWild: false
              }, {
                type: 'property',
                id: 25,
                name: 'North Carolina Avenue',
                color: 'green',
                currentColor: 'green',
                value: 3,
                isWild: false
              }, {
                type: 'property',
                id: 26,
                name: 'Pennsylvania Avenue',
                color: 'green',
                currentColor: 'green',
                value: 3,
                isWild: false
              }, {
                type: 'property',
                id: 27,
                name: 'Wild Property',
                color: ['blue', 'green'],
                currentColor: 'green',
                value: 0,
                isWild: true
              }]
            })} */}
          </div>

          {/* Center Action Area */}
          <div className="bg-gray-100 rounded-xl p-6 shadow-inner flex gap-6">
            {renderDrawPile(numCardsInDrawPile)} 
            {renderActionPile(lastAction)}
          </div>

          {/* Right Property Set */}
          <div className="flex-1">
            {renderPropertySet(opponentProperties, true)}
          </div>
        </div>
        
        {/* Player's Area */}
        <div className="w-full">
          {renderBankAndCards(playerHand, playerBank)}
        </div>
      </div>
    </div>
  );
};

export default MainGame;