import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './auth/Navbar';
import MoneyCard from './cards/MoneyCard';
import PropertyCard from './cards/PropertyCard';
import ActionCard from './cards/ActionCard';
import BankAndCards from './game/BankAndCards';
import PropertySet from './game/PropertySet';
import GameCenter from './game/GameCenter';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import { handleHousePlacement } from './actions/HousePlacement';
import { handleHotelPlacement } from './actions/HotelPlacement';

const MainGame = () => {  
  const { roomId } = useParams();
  const { socket } = useWebSocket();
  const { user } = useAuth();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [playerHand, setPlayerHand] = useState([]);
  const [playerBank, setPlayerBank] = useState([]);
  const [playerProperties, setPlayerProperties] = useState({});
  const [mainSets, setMainSets] = useState({});
  const [overflowSets, setOverflowSets] = useState({});
  const [opponentHand, setOpponentHand] = useState([]);
  const [opponentBank, setOpponentBank] = useState([]);
  const [opponentProperties, setOpponentProperties] = useState({});
  const [numCardsInDrawPile, setNumCardsInDrawPile] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [pendingHouseCard, setPendingHouseCard] = useState(null);
  const [pendingHotelCard, setPendingHotelCard] = useState(null);
  const [pendingPassGoCard, setPendingPassGoCard] = useState(null);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState('');
  const [currentTurnPlayerName, setCurrentTurnPlayerName] = useState('');
  const [actionsRemaining, setActionsRemaining] = useState(3);
  const isUserTurnRef = useRef(false);

  // Auto-dismiss notifications
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Check if it's user's turn whenever currentTurnPlayerId changes
  useEffect(() => {
    console.log(currentTurnPlayerId, user.unique_id, currentTurnPlayerId === user.unique_id);
    isUserTurnRef.current = currentTurnPlayerId === user.unique_id;
  }, [currentTurnPlayerId, user.unique_id]);

  // CONSTANTS
  const colorOrder = ['brown', 'mint', 'blue', 'light blue', 'pink', 'orange', 'red', 'yellow', 'green', 'black']
  const setRequirements = {
    'brown': 2, 'mint': 2, 'blue': 2,
    'light blue': 3, 'pink': 3, 'orange': 3, 'red': 3, 'yellow': 3, 'green': 3,
    'black': 4
  };
  const ItemTypes = {
    CARD: 'card'
  };

  // Split properties into main sets and overflow
  const splitProperties = (properties) => {
    const mainSets = {};
    const overflowSets = {};

    Object.entries(properties).forEach(([color, cards]) => {
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

    return { mainSets, overflowSets };
  };

  // Update mainSets and overflowSets whenever properties change
  useEffect(() => {
    const { mainSets: newMainSets, overflowSets: newOverflowSets } = splitProperties(playerProperties);
    setMainSets(newMainSets);
    setOverflowSets(newOverflowSets);
  }, [playerProperties]);

  // SOCKET HANDLING
  
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
        // Get the first opponent's properties (since it's a 2-player game)
        const opponent = opponents[0];
        setOpponentHand(opponentCards);
        setOpponentBank(opponentBanks);
        setOpponentProperties(opponent ? opponent.properties : {});
        setNumCardsInDrawPile(gameState.deck_count);
        setLastAction(gameState.discard_pile ? gameState.discard_pile[gameState.discard_pile.length - 1] : null);
        // Convert current turn ID to username  
        setCurrentTurnPlayerId(gameState.current_turn);
        const currentTurnPlayer = gameState.players.find(p => p.id === gameState.current_turn);
        setCurrentTurnPlayerName(currentTurnPlayer ? currentTurnPlayer.name : '');
        setActionsRemaining(gameState.actions_remaining || 0);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  useEffect(() => {
    if (pendingHouseCard) {
      console.log("Handling pending house with properties:", playerProperties);
      handleHousePlacement(pendingHouseCard, playerProperties, setError, socket, user, setRequirements, mainSets, overflowSets);
      setPendingHouseCard(null);
    }
  }, [pendingHouseCard]);

  useEffect(() => {
    if (pendingHotelCard) {
      console.log("Handling pending hotel with properties:", playerProperties);
      handleHotelPlacement(pendingHotelCard, playerProperties, setError, socket, user, setRequirements, mainSets, overflowSets);
      setPendingHotelCard(null);
    }
  }, [pendingHotelCard])

  useEffect(() => {
    if (pendingPassGoCard) {
      console.log("Handling pending Pass Go with hand:", playerHand);
      console.log(2 - 1 + playerHand.length - (actionsRemaining - 1), (2 - 1 + playerHand.length - (actionsRemaining - 1) > 7));
      if (2 - 1 + playerHand.length - (actionsRemaining - 1) > 7) {
        setError('Pass Go cannot be played as it will exceed the 7-card limit');
        setPendingPassGoCard(null);
        return;
      }
      socket.send(JSON.stringify({
        'action': 'pass_go',
        'player': user.unique_id,
        'card': pendingPassGoCard
      }));
      setPendingPassGoCard(null);
    }
  }, [pendingPassGoCard]);

  const handleCardDropBank = (card) => {
    console.log("Dropping card to bank:", card);
    console.log("IS TURN:", isUserTurnRef.current);
    // if (!checkIsUserTurn()) return;
    if (!isUserTurnRef.current) {
      setError('It is not your turn yet');
      return;
    }
    
    // Function to send card to bank
    const sendToBank = () => {
      if (card.type === 'property') {
        setError('Properties cannot be placed in the bank');
        return;
      } 
      socket.send(JSON.stringify({
        'action': 'to_bank',
        'player': user.unique_id,
        'card': card
      }))
    };

    // Delay the actual card removal to allow for animation
    setTimeout(sendToBank, 300);
  };

  const handleCardDropProperty = (card) => {
    console.log("Dropping card to property:", card);
    // if (!checkIsUserTurn()) return;
    if (!isUserTurnRef.current) {
      setError('It is not your turn yet');
      return; 
    }
    const sendToProperties = () => {
      if (card.type === 'money') {
        setError('Money cards cannot be placed in properties');
        return;
      }
      else if (card.type === 'action') {
        if (card.name.toLowerCase() === 'house') {
          console.log("Setting pending house card");
          setPendingHouseCard(card);
        } else if (card.name.toLowerCase() === 'hotel') {
          console.log("Setting pending hotel card");
          setPendingHotelCard(card);
        } else {
          setError('Only house and hotel action cards can be placed in properties');
        }
        return;
      }
      else if (card.type === 'property' && card.isWild) {
        // Create color selection buttons
        const colorButtons = document.createElement('div');
        
        // Function to update position
        const updatePosition = () => {
          const propertySet = document.querySelector('.property-set');
          if (!propertySet || !colorButtons) return;
          const rect = propertySet.getBoundingClientRect();
          colorButtons.style.position = 'fixed';
          colorButtons.style.top = rect.top + 'px';
          colorButtons.style.left = rect.left + 'px';
          colorButtons.style.width = rect.width + 'px';
          colorButtons.style.height = rect.height + 'px';
        };

        // Initial position
        updatePosition();
        
        // Add resize listener
        const resizeObserver = new ResizeObserver(updatePosition);
        resizeObserver.observe(document.querySelector('.property-set'));
        window.addEventListener('resize', updatePosition);
        
        colorButtons.style.backgroundColor = 'transparent';
        colorButtons.style.display = 'flex';
        colorButtons.style.flexDirection = 'column';
        colorButtons.style.borderRadius = '8px';
        colorButtons.style.overflow = 'hidden';
        colorButtons.style.zIndex = '1000';
        
        const colorStyles = {
          'brown': '#92400E',
          'light blue': '#7DD3FC',
          'pink': '#F9A8D4',
          'orange': '#FB923C',
          'red': '#EF4444',
          'yellow': '#FDE047',
          'green': '#16A34A',
          'blue': '#2563EB',
          'black': '#1F2937',
          'mint': '#A7F3D0'
        };
        
        // Create split sections for each color
        card.color.forEach((color, index) => {
          const section = document.createElement('div');
          section.style.flex = `1`;
          section.style.backgroundColor = colorStyles[color];
          section.style.opacity = '0.8';
          section.style.cursor = 'pointer';
          section.style.position = 'relative';
          section.style.transition = 'opacity 0.2s ease';
          
          // Add color label
          const label = document.createElement('div');
          label.textContent = color;
          label.style.position = 'absolute';
          label.style.left = '50%';
          label.style.top = '50%';
          label.style.transform = 'translate(-50%, -50%)';
          label.style.color = ['yellow', 'mint', 'light blue'].includes(color) ? '#1F2937' : 'white';
          label.style.fontSize = '1rem';
          label.style.fontWeight = '600';
          label.style.textTransform = 'capitalize';
          label.style.textShadow = ['yellow', 'mint', 'light blue'].includes(color) ? 'none' : '0 1px 2px rgba(0,0,0,0.2)';
          label.style.pointerEvents = 'none'; // Ensure hover works properly
          
          section.appendChild(label);
          
          section.onmouseover = () => {
            section.style.opacity = '0.9';
          };
          
          section.onmouseout = () => {
            section.style.opacity = '0.8';
          };
          
          section.onclick = () => {
            section.style.opacity = '1';
            setTimeout(() => {
              console.log("COLOR:", color);
              card.currentColor = color;
              console.log(card);
              socket.send(JSON.stringify({
                'action': 'to_properties',
                'player': user.unique_id,
                'card': card
              }));
              resizeObserver.disconnect();
              window.removeEventListener('resize', updatePosition);
              document.body.removeChild(colorButtons);
            }, 50);
          };
          
          colorButtons.appendChild(section);
        });
        
        document.body.appendChild(colorButtons);
        return;
      }

      socket.send(JSON.stringify({
        'action': 'to_properties',
        'player': user.unique_id,
        'card': card
      }));
    }

    // Delay the actual card removal to allow for animation
    setTimeout(sendToProperties, 300);
  };

  const handleCardDropAction = (card) => {
    console.log("Dropping card to action area:", card);

    if (!isUserTurnRef.current) {
      setError('It is not your turn yet');
      return;
    }
    
    const sendToAction = () => {
      if (card.type !== 'action') {
        setError("Money/properties cannot be played in the action pile");
        return;
      }
      else if (card.name.toLowerCase() === 'house' || card.name.toLowerCase() === 'hotel') {
        setError('Only action cards apart from house and hotel can be played in the action area');
        return;
      }
      else if (card.name.toLowerCase() === 'pass go') {
        setPendingPassGoCard(card);
      }
    };

    // Delay the actual card removal to allow for animation
    setTimeout(sendToAction, 300);
  };

  const DraggableCard = ({ card, children }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: ItemTypes.CARD,
      item: { card },
      end: (item, monitor) => {
        const dropResult = monitor.getDropResult();
        if (dropResult) {
          setIsDragging(true);
          setTimeout(() => setIsDragging(false), 300);
        }
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    }));

    return (
      <motion.div 
        ref={drag}
        initial={false}
        className="relative transform-gpu"
      >
        {children}
      </motion.div>
    );
  };

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
            isUtility={card.isUtility}
            isRailroad={card.isRailroad}
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

  const handleSkipTurn = () => {
    if (!isUserTurnRef.current) {
      setError('It is not your turn yet');
      return;
    }
    if (playerHand.length > 7) {
      setError('You cannot skip your turn when you have more than 7 cards in hand');
      return;
    }
    socket.send(JSON.stringify({
      'action': 'skip_turn',
      'player': user.unique_id
    }));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ 
                type: "spring",
                stiffness: 100,
                damping: 15,
                mass: 1
              }}
              className="fixed bottom-8 right-4 z-50 flex items-center gap-4 text-red-600 bg-red-50 px-6 py-4 rounded-xl shadow-2xl max-w-md border border-red-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 flex-shrink-0">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <p className="text-base font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Game Layout */}
        <div className="flex flex-col justify-between h-[calc(100vh-4rem)] py-32 px-8 overflow-hidden bg-gray-200">
          {/* Turn Display */}
          <div className="absolute top-20 left-8" style={{ zIndex: 1000 }}>
            <div className="flex items-center gap-3">
              <div className={`text-lg font-semibold px-4 py-2 rounded-lg ${currentTurnPlayerId === user.unique_id ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {currentTurnPlayerId === user.unique_id ? "Your Turn" : `${currentTurnPlayerName}'s Turn`} #{4 - actionsRemaining}
              </div>
              {currentTurnPlayerId === user.unique_id && (
                <button 
                  onClick={handleSkipTurn}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-gray-100 rounded-lg font-medium transition-colors"
                >
                  Skip Turn
                </button>
              )}
            </div>
          </div>

          {/* Opponent's Area */}
          <div className="w-full">
            <BankAndCards 
              hand={opponentHand}
              bank={opponentBank}
              isOpponent={true}
              ItemTypes={ItemTypes}
              handleCardDrop={handleCardDropBank}
              DraggableCard={DraggableCard}
              renderCardContent={renderCardContent}
            />
          </div>

          {/* Center Area with Property Sets */}
          <div className="w-full flex justify-between items-center gap-6">
            {/* Left Property Set */}
            <div className="flex-1">
              <PropertySet 
                properties={playerProperties}
                setRequirements={setRequirements}
                colorOrder={colorOrder}
                isOpponent={false}
                ItemTypes={ItemTypes}
                onDrop={(item) => handleCardDropProperty(item.card)}
              />
            </div>

            {/* Game Center */}
            <div className="flex-shrink-0">
              <GameCenter 
                numCardsInDrawPile={numCardsInDrawPile}
                lastAction={lastAction}
                renderCardContent={renderCardContent}
                ItemTypes={ItemTypes}
                handleCardDrop={handleCardDropAction}
              />
            </div>

            {/* Right Property Set */}
            <div className="flex-1">
              <PropertySet 
                properties={opponentProperties}
                isOpponent={true}
                setRequirements={setRequirements}
                colorOrder={colorOrder}
              />
            </div>
          </div>
          
          {/* Player's Area */}
          <div className="w-full">
            <BankAndCards 
              hand={playerHand}
              bank={playerBank}
              isOpponent={false}
              ItemTypes={ItemTypes}
              handleCardDrop={handleCardDropBank}
              DraggableCard={DraggableCard}
              renderCardContent={renderCardContent}
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default MainGame;
