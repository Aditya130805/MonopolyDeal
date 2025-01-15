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
import ActionAnimation from './animations/ActionAnimation';
import CardNotification from './animations/CardNotification';
import RentModal from './modals/RentModal';
import ErrorNotification from './notifications/ErrorNotification';
import RentCollectionOverlay from './overlays/RentCollectionOverlay';
import PaymentSuccessfulOverlay from './animations/PaymentSuccessfulOverlay';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import { handleHousePlacement } from './actions/HousePlacement';
import { handleHotelPlacement } from './actions/HotelPlacement';
import { handleWildPropertySelection } from '../utils/wildPropertyHandler';
import { handleRentColorSelection } from '../utils/rentActionHandler';

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
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState('');
  const [currentTurnPlayerName, setCurrentTurnPlayerName] = useState('');
  const [actionsRemaining, setActionsRemaining] = useState(3);
  const [showActionAnimation, setShowActionAnimation] = useState({ visible: false, action: null, onComplete: null });
  const [showCardNotification, setShowCardNotification] = useState({ visible: false, card: null, actionType: null });
  const cardNotificationTimeoutRef = useRef(null);
  const [showRentCollectionOverlay, setShowRentCollectionOverlay] = useState(false);
  const isUserTurnRef = useRef(false);
  const [pendingHouseCard, setPendingHouseCard] = useState(null);
  const [pendingHotelCard, setPendingHotelCard] = useState(null);
  const [pendingPassGoCard, setPendingPassGoCard] = useState(null);
  const [pendingItsYourBirthdayCard, setPendingItsYourBirthdayCard] = useState(null);
  const [pendingDebtCollectorCard, setPendingDebtCollectorCard] = useState(null);
  const [pendingRentCard, setPendingRentCard] = useState(null);
  const [rentAmount, setRentAmount] = useState(0);
  const [rentRecipientId, setRentRecipientId] = useState(null);
  const [showPaymentSuccessfulOverlay, setShowPaymentSuccessfulOverlay] = useState(false);

  // State for rent modal
  const [rentModalOpen, setRentModalOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (cardNotificationTimeoutRef.current) {
        clearTimeout(cardNotificationTimeoutRef.current);
      }
    };
  }, []);

  const handleRentPayment = (selectedCards) => {
    // Send the payment to the server
    console.log("Sending rent payment for selected cards:", selectedCards);
    const message = {
      action: 'rent_payment',
      player: user.unique_id,
      recipient_id: rentRecipientId,
      card: {
        selected_cards: selectedCards.map(card => card.id),
      }
    };
    console.log("Sending rent payment message:", message);
    socket.send(JSON.stringify(message));
  };

  //////////////////// CHECK IF IT'S USER'S TURN
  useEffect(() => {
    isUserTurnRef.current = currentTurnPlayerId === user.unique_id;
  }, [currentTurnPlayerId, user.unique_id]);

  //////////////////// CONSTANTS
  const colorOrder = ['brown', 'mint', 'blue', 'light blue', 'pink', 'orange', 'red', 'yellow', 'green', 'black']
  const setRequirements = {
    'brown': 2, 'mint': 2, 'blue': 2,
    'light blue': 3, 'pink': 3, 'orange': 3, 'red': 3, 'yellow': 3, 'green': 3,
    'black': 4
  };
  const ItemTypes = {
    CARD: 'card'
  };

  //////////////////// PROPERTIES INTO MAIN SETS AND OVERFLOW SETS
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
  useEffect(() => {
    const { mainSets: newMainSets, overflowSets: newOverflowSets } = splitProperties(playerProperties);
    setMainSets(newMainSets);
    setOverflowSets(newOverflowSets);
  }, [playerProperties]);

  //////////////////// SOCKET HANDLING
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

  //////////////////// HANDLE WEBSOCKET MESSAGES
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`(Handler 2) WebSocket message in room ${roomId}:`, data);

      // CARD_PLAYED
      if (data.type && data.type === 'card_played') {
        // Clear any existing timeout
        if (cardNotificationTimeoutRef.current) {
          clearTimeout(cardNotificationTimeoutRef.current);
        }
        
        // Show notification to all players
        setShowCardNotification({ 
          visible: true, 
          card: data.card,
          actionType: data.action_type 
        });
        
        // Set new timeout to hide notification
        cardNotificationTimeoutRef.current = setTimeout(() => {
          setShowCardNotification(prev => ({ ...prev, visible: false }));
          cardNotificationTimeoutRef.current = null;
        }, 2000);
        
        // Additionally show action animation for specific cases
        if (data.player_id === user.unique_id && data.card.type === 'action' && data.card.name.toLowerCase() !== 'house' && data.card.name.toLowerCase() !== 'hotel' && data.action_type !== 'to_bank' && data.action_type !== 'to_properties') {
          setShowActionAnimation({ visible: true, action: data.action });
          // Hide animation after 2 seconds
          setTimeout(() => {
            setShowActionAnimation(prev => ({ ...prev, visible: false }));
          }, 2000);
        }
        return;
      }

      // RENT_REQUEST
      else if (data.type && data.type === 'rent_request') {
        console.log("RENT REQUEST DATA:", data)
        setRentAmount(data.amount);
        setRentRecipientId(data.recipient_id);
        if (data.recipient_id !== user.unique_id) {
          setRentModalOpen(true);
        }
        else {
          // Show rent animation first for the player who played the rent card
          setShowActionAnimation({
            visible: true,
            action: data.rent_type === "it's your birthday" ? 'Birthday Request' : data.rent_type === "debt collector" ? 'Debt Request' : 'Rent Request'
          });
          // Wait 2 seconds then start transitioning
          setTimeout(() => {
            // Hide action animation (will trigger fade out)
            setShowActionAnimation(prev => ({ ...prev, visible: false }));
            // Show rent collection overlay
            setShowRentCollectionOverlay(true);
          }, 2000);
        }
      }

      // RENT_PAID
      else if (data.type === 'rent_paid') {
        console.log("RENT PAID RECEIVED!", data)
        // Hide overlay for the player who requested rent
        setShowRentCollectionOverlay(false);
        // Clear states since rent collection is complete
        setRentModalOpen(false);
        setRentAmount(0);
        setRentRecipientId(null);
        setShowPaymentSuccessfulOverlay(true);
        // Hide overlay after 2 seconds
        setTimeout(() => {
          setShowPaymentSuccessfulOverlay(false);
        }, 2000);

      }

      // GAME_UPDATE
      else if (data.type && data.type === 'game_update') {
        const gameState = data.state;
        
        // Find current player and update their hand
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

  //////////////////// ACTION USE EFFECTS
  useEffect(() => {
    if (pendingHouseCard) {
      handleHousePlacement(pendingHouseCard, playerProperties, setError, socket, user, setRequirements, mainSets, overflowSets);
      setPendingHouseCard(null);
    }
  }, [pendingHouseCard]);
  useEffect(() => {
    if (pendingHotelCard) {
      handleHotelPlacement(pendingHotelCard, playerProperties, setError, socket, user, setRequirements, mainSets, overflowSets);
      setPendingHotelCard(null);
    }
  }, [pendingHotelCard])
  useEffect(() => {
    if (pendingPassGoCard) {
      if (2 - 1 + playerHand.length - (actionsRemaining - 1) > 7) {
        setError('Pass Go cannot be played as it will exceed the 7-card limit');
        setPendingPassGoCard(null);
        return;
      }
      setShowActionAnimation({ visible: true, action: 'pass_go' });
      socket.send(JSON.stringify({
        'action': 'pass_go',
        'player': user.unique_id,
        'card': pendingPassGoCard
      }));
      setPendingPassGoCard(null);
    }
  }, [pendingPassGoCard]);
  useEffect(() => {
    if (pendingItsYourBirthdayCard) {
      setShowActionAnimation({ visible: true, action: "It's Your Birthday!" });
      socket.send(JSON.stringify({
        action: "it's_your_birthday",
        player: user.unique_id,
        card: pendingItsYourBirthdayCard
      }));
      setPendingItsYourBirthdayCard(null);
    }
  }, [pendingItsYourBirthdayCard]);
  useEffect(() => {
    if (pendingDebtCollectorCard) {
      setShowActionAnimation({ visible: true, action: "Debt Collector" });
      socket.send(JSON.stringify({
        action: "debt_collector",
        player: user.unique_id,
        card: pendingDebtCollectorCard
      }))
      setPendingDebtCollectorCard(null);
    }
  }, [pendingDebtCollectorCard]);
  useEffect(() => {
    if (pendingRentCard) {

      console.log("Player properties:", playerProperties);

      let hasMatchingProperties = false;
      for (let rentColor of pendingRentCard.rentColors) {
        for (let [color, cards] of Object.entries(playerProperties)) {
          if (color.toLowerCase() === rentColor.toLowerCase()) {
            const hasPropertyCards = cards.some(c => c.type === 'property');
            if (hasPropertyCards) {
              hasMatchingProperties = true;
              break;
            }
          }
        }
        if (hasMatchingProperties) {
          break;
        }
      }
      if (!hasMatchingProperties) {
        setError("You don't have any properties matching the rent card colors!");
        setPendingRentCard(null);
        return;
      }
      handleRentColorSelection(pendingRentCard, playerProperties, socket, user, setShowActionAnimation, setPendingRentCard);
    }
  }, [pendingRentCard]);

  //////////////////// DROP ZONE HANDLERS
  const handleCardDropBank = (card) => {
    console.log("Dropping CARD to BANK:", card);
    if (!isUserTurnRef.current) {
      setError('Please wait for your turn to play');
      return;
    }
    if (card.type === 'property') {
      setError('Properties cannot be placed in the bank');
      return;
    }
    const sendToBank = () => {
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
    console.log("Dropping CARD to PROPERTY:", card);
    if (!isUserTurnRef.current) {
      setError('Please wait for your turn to play');
      return; 
    }
    if (card.type === 'money') {
      setError('Money cards cannot be placed in properties');
      return;
    } else if (card.type === 'action' && card.name.toLowerCase() !== 'house' && card.name.toLowerCase() !== 'hotel') {
      setError('Only house and hotel action cards can be placed in properties');
      return;
    }
    const sendToProperties = () => {
      if (card.type === 'action') {
        if (card.name.toLowerCase() === 'house') {
          setPendingHouseCard(card);
        } else if (card.name.toLowerCase() === 'hotel') {
          setPendingHotelCard(card);
        }
        return;
      }
      else if (card.type === 'property' && card.isWild) {
        handleWildPropertySelection(card, socket, user);
        return;
      }
      socket.send(JSON.stringify({
        'action': 'to_properties',
        'player': user.unique_id,
        'card': card
      }));
    };
    // Delay the actual card removal to allow for animation
    setTimeout(sendToProperties, 300);
  };
  const handleCardDropAction = (card) => {
    console.log("Dropping CARD to ACTION:", card);
    if (!isUserTurnRef.current) {
      setError('Please wait for your turn to play');
      return;
    }
    if (card.type !== 'action') {
      setError("Money/properties cannot be played in the action pile");
      return;
    } else if (card.name.toLowerCase() === 'house' || card.name.toLowerCase() === 'hotel') {
      setError('Only action cards apart from house and hotel can be played in the action area');
      return;
    }

    const sendToAction = () => {
      if (card.name.toLowerCase() === 'pass go') {
        setPendingPassGoCard(card);
      } else if (card.name.toLowerCase() === "it's your birthday") {
        setPendingItsYourBirthdayCard(card);
      } else if (card.name.toLowerCase() === "debt collector") {
        setPendingDebtCollectorCard(card);
      } else if (card.name.toLowerCase() === "rent" || card.name.toLowerCase() === "multicolor rent") {
        setPendingRentCard(card);
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
        
        <ErrorNotification error={error} setError={setError} />
        <RentCollectionOverlay isVisible={showRentCollectionOverlay} />
        <ActionAnimation 
          action={showActionAnimation.action}
          isVisible={showActionAnimation.visible}
          onComplete={() => setShowActionAnimation({ visible: false, action: null })}
        />
        <CardNotification
          card={showCardNotification.card}
          isVisible={showCardNotification.visible}
          actionType={showCardNotification.actionType}
          onComplete={() => setShowCardNotification({ visible: false, card: null, actionType: null })}
        />
        <PaymentSuccessfulOverlay
          isVisible={showPaymentSuccessfulOverlay}
        />
        
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
      <RentModal
        isOpen={rentModalOpen}
        onClose={() => {
          socket.send(JSON.stringify({
            'action': 'rent_paid'
          }));
        }}
        amountDue={rentAmount}
        playerBank={playerBank}
        playerProperties={playerProperties}
        onPaymentSubmit={handleRentPayment}
      />
    </DndProvider>
  );
};

export default MainGame;
