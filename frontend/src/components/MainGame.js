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
import ActionAnimation from './overlays/ActionAnimation';
import CardNotification from './notifications/CardNotification';
import RentModal from './modals/RentModal';
import SlyDealModal from './modals/SlyDealModal';
import ForcedDealModal from './modals/ForcedDealModal';
import ErrorNotification from './notifications/ErrorNotification';
import RentCollectionOverlay from './overlays/RentCollectionOverlay';
import PaymentSuccessfulOverlay from './overlays/PaymentSuccessfulOverlay';
import PropertyStealOverlay from './overlays/PropertyStealOverlay';
import PropertySwapOverlay from './overlays/PropertySwapOverlay';
import DealBreakerModal from './modals/DealBreakerModal';
import DealBreakerOverlay from './overlays/DealBreakerOverlay';
import DoubleRentOverlay from './overlays/DoubleRentOverlay';
import WinnerOverlay from './overlays/WinnerOverlay';
import TieOverlay from './overlays/TieOverlay';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { motion, AnimatePresence } from 'framer-motion';
import { handleHousePlacement } from './actions/HousePlacement';
import { handleHotelPlacement } from './actions/HotelPlacement';
import { handleWildPropertySelection } from '../utils/wildPropertyHandler';
import { handleRentColorSelection } from '../utils/rentActionHandler';
import { handleRentPayment, handleDoubleRentResponse } from './actions/RentActions';
import { handleSlyDealPropertySelect, handleForcedDealSelect, handleDealBreakerSetSelect } from './actions/PropertyActions';
import { handleCardDropBank, handleCardDropProperty, handleCardDropAction } from './actions/DropZoneHandlers';
import { handleWebSocketMessage } from './actions/WebSocketHandlers';

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
  const [opponentId, setOpponentId] = useState('');
  const [opponentName, setOpponentName] = useState('');
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
  const rentCollectionTimeoutRef = useRef(null);
  const [showRentCollectionOverlay, setShowRentCollectionOverlay] = useState(false);
  const isUserTurnRef = useRef(false);
  const [pendingHouseCard, setPendingHouseCard] = useState(null);
  const [pendingHotelCard, setPendingHotelCard] = useState(null);
  const [pendingPassGoCard, setPendingPassGoCard] = useState(null);
  const [pendingItsYourBirthdayCard, setPendingItsYourBirthdayCard] = useState(null);
  const [pendingDebtCollectorCard, setPendingDebtCollectorCard] = useState(null);
  const [pendingRentCard, setPendingRentCard] = useState(null);
  const [pendingSlyDealCard, setPendingSlyDealCard] = useState(null);
  const [pendingForcedDealCard, setPendingForcedDealCard] = useState(null);
  const [pendingDealBreakerCard, setPendingDealBreakerCard] = useState(null);
  const [forcedDealModalOpen, setForcedDealModalOpen] = useState(false);
  const [rentAmount, setRentAmount] = useState(0);
  const [rentRecipientId, setRentRecipientId] = useState(null);
  const [rentType, setRentType] = useState(null);
  const [showPaymentSuccessfulOverlay, setShowPaymentSuccessfulOverlay] = useState({
    isVisible: false,
    playerName: '',
    targetName: '',
    selectedCards: []
  });
  const [slyDealModalOpen, setSlyDealModalOpen] = useState(false);
  const [dealBreakerModalOpen, setDealBreakerModalOpen] = useState(false);
  const [propertyStealAnimation, setPropertyStealAnimation] = useState(null);
  const [propertySwapAnimation, setPropertySwapAnimation] = useState(null);
  const [dealBreakerOverlay, setDealBreakerOverlay] = useState({
    isVisible: false,
    playerName: '',
    targetName: '',
    color: '',
    propertySet: []
  });
  const [showDoubleRentOverlay, setShowDoubleRentOverlay] = useState(false);
  const [doubleRentAmount, setDoubleRentAmount] = useState(0);

  // State for rent modal
  const [rentModalOpen, setRentModalOpen] = useState(false);

  const [winner, setWinner] = useState(null);
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
  const [showTieOverlay, setShowTieOverlay] = useState(false);

  useEffect(() => {
    return () => {
      if (cardNotificationTimeoutRef.current) {
        clearTimeout(cardNotificationTimeoutRef.current);
      }
    };
  }, []);

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
  const rents = {
    'brown': [1, 2], 'mint': [1, 2], 'blue': [3, 8],
    'light blue': [1, 2, 3], 'pink': [1, 2, 4], 'orange': [1, 3, 5], 'red': [2, 3, 6], 'yellow': [2, 4, 6], 'green': [2, 4, 7],
    'black': [1, 2, 3, 4]
  }

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
    socket.onmessage = (event) => handleWebSocketMessage(event, user, roomId, cardNotificationTimeoutRef, setShowCardNotification, setShowActionAnimation, setRentAmount, setRentRecipientId, setRentModalOpen, setShowRentCollectionOverlay, setShowPaymentSuccessfulOverlay, setRentType, setPropertyStealAnimation, setPropertySwapAnimation, setDealBreakerOverlay, setPlayerHand, setPlayerBank, setPlayerProperties, setOpponentHand, setOpponentBank, setOpponentProperties, setNumCardsInDrawPile, setLastAction, setCurrentTurnPlayerId, setCurrentTurnPlayerName, setActionsRemaining, setOpponentId, setOpponentName, rentCollectionTimeoutRef, setWinner, setShowWinnerOverlay, setShowTieOverlay);
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

      handleRentColorSelection(pendingRentCard, playerProperties, playerHand, actionsRemaining, socket, user, setRentAmount, setDoubleRentAmount, setShowActionAnimation, setPendingRentCard, setShowDoubleRentOverlay);
    }
  }, [pendingRentCard]);
  useEffect(() => {
    if (pendingSlyDealCard) {
      // Check if opponents have any properties at all
      if (Object.keys(opponentProperties).length === 0) {
        setError("Opponent doesn't have any properties!");
        setPendingSlyDealCard(null);
        return;
      }

      // Split opponent's properties into main and overflow sets
      const { mainSets, overflowSets } = splitProperties(opponentProperties);

      // Check if there are any stealable properties
      let hasStealableProperties = false;

      // Check main sets for incomplete sets
      for (const [color, cards] of Object.entries(mainSets)) {
        const propertyCards = cards.filter(card => card.type === 'property');
        if (propertyCards.length < setRequirements[color]) {
          // If main set is incomplete, we can steal from it
          hasStealableProperties = true;
          break;
        }
      }

      // If no stealable properties in main sets, check overflow sets
      if (!hasStealableProperties) {
        for (const [color, cards] of Object.entries(overflowSets)) {
          if (cards && cards.length > 0) {
            const propertyCards = cards.filter(card => card.type === 'property');
            
            // Check if this overflow set is complete
            if (propertyCards.length < setRequirements[color]) {
              hasStealableProperties = true;
              break;
            }
          }
        }
      }

      if (!hasStealableProperties) {
        setError("Opponent has no properties that can be stolen!");
        setPendingSlyDealCard(null);
        return;
      }

      setSlyDealModalOpen(true);
    }
  }, [pendingSlyDealCard]);
  useEffect(() => {
    if (pendingForcedDealCard) {
      // Check if player has any properties to swap
      if (Object.keys(playerProperties).length === 0) {
        setError("You don't have any properties to swap!");
        setPendingForcedDealCard(null);
        return;
      }

      // Check if opponents have any properties at all
      if (Object.keys(opponentProperties).length === 0) {
        setError("Opponent doesn't have any properties!");
        setPendingForcedDealCard(null);
        return;
      }

      // Split opponent's properties into main and overflow sets
      const { mainSets, overflowSets } = splitProperties(opponentProperties);

      // Check if there are any stealable properties
      let hasStealableProperties = false;

      // Check main sets for incomplete sets
      for (const [color, cards] of Object.entries(mainSets)) {
        const propertyCards = cards.filter(card => card.type === 'property');
        if (propertyCards.length < setRequirements[color]) {
          // If main set is incomplete, we can steal from it
          hasStealableProperties = true;
          break;
        }
      }

      // If no stealable properties in main sets, check overflow sets
      if (!hasStealableProperties) {
        for (const [color, cards] of Object.entries(overflowSets)) {
          if (cards && cards.length > 0) {
            const propertyCards = cards.filter(card => card.type === 'property');
            
            // Check if this overflow set is complete
            if (propertyCards.length < setRequirements[color]) {
              hasStealableProperties = true;
              break;
            }
          }
        }
      }

      if (!hasStealableProperties) {
        setError("Opponent has no properties that can be stolen!");
        setPendingForcedDealCard(null);
        return;
      }

      setForcedDealModalOpen(true);
    }
  }, [pendingForcedDealCard]);
  useEffect(() => {
    if (pendingDealBreakerCard) { 
      const isCompleteSet = (color, cards) => {
        if (!Array.isArray(cards)) return false;
        const requiredCards = setRequirements[color] || 0;
        return cards.length >= requiredCards;
      };
    
      // Check if there are any complete sets
      const hasCompleteSets = Object.entries(opponentProperties).some(([color, cards]) => isCompleteSet(color, cards));    
      
      if (!hasCompleteSets) {
        setError("Your opponent doesn't have any complete sets!");
        setPendingDealBreakerCard(null);
        return;
      }
      
      setDealBreakerModalOpen(true);
    }
  }, [pendingDealBreakerCard]);

  // Handle sly deal property selection
  const handleSlyDealPropertySelectWrapper = (selectedProperty) => {
    handleSlyDealPropertySelect(selectedProperty, socket, user, pendingSlyDealCard, setPendingSlyDealCard);
  };

  // Handle forced deal property selection
  const handleForcedDealSelectWrapper = (opponentProperty, userProperty) => {
    handleForcedDealSelect(opponentProperty, userProperty, socket, user, pendingForcedDealCard, setForcedDealModalOpen, setPendingForcedDealCard);
  };

  // Handle deal breaker set selection
  const handleDealBreakerSetSelectWrapper = (selectedSet) => {
    handleDealBreakerSetSelect(selectedSet, socket, user, pendingDealBreakerCard, setDealBreakerModalOpen, setPendingDealBreakerCard);
  };

  // Handle double rent response
  const handleDoubleRentResponseWrapper = (useDoubleRent) => {
    handleDoubleRentResponse(useDoubleRent, socket, user, pendingRentCard, playerHand, doubleRentAmount, rentAmount, setShowDoubleRentOverlay, setPendingRentCard, setShowActionAnimation);
  };

  // Handle rent payment
  const handleRentPaymentWrapper = (selectedCards) => {
    handleRentPayment(selectedCards, socket, user, rentRecipientId);
  };

  //////////////////// DROP ZONE HANDLERS
  const handleCardDropBankWrapper = (card) => {
    handleCardDropBank(card, isUserTurnRef, socket, user, setError);
  };
  const handleCardDropPropertyWrapper = (card) => {
    handleCardDropProperty(card, isUserTurnRef, socket, user, setPendingHouseCard, setPendingHotelCard, setError);
  };
  const handleCardDropActionWrapper = (card) => {
    handleCardDropAction(card, isUserTurnRef, socket, user, setPendingPassGoCard, setPendingItsYourBirthdayCard, setPendingDebtCollectorCard, setPendingRentCard, setPendingSlyDealCard, setPendingForcedDealCard, setPendingDealBreakerCard, setError);
  };

  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const dndBackend = TouchBackend;
  const dndOptions = {
    enableMouseEvents: true,
    delay: 0,
    delayTouchStart: 0,
    enableKeyboardEvents: false,
    enableHoverOutsideTarget: false,
    ignoreContextMenu: true,
    touchSlop: 2,
    scrollAngleRanges: [{ start: 30, end: 330 }],
    getDropTargetElementsAtPoint: (x, y, dropTargets) => {
      const elements = document.elementsFromPoint(x, y);
      return dropTargets.filter(t => elements.indexOf(t) > -1);
    }
  };

  const DraggableCard = ({ card, children }) => {
    const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
      type: ItemTypes.CARD,
      item: { card },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    }));

    const handleTouchStart = (e) => {
      // Prevent default touch behavior
      e.preventDefault();
      
      const touch = e.touches[0];
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      
      // Create a drag preview element
      const preview = target.cloneNode(true);
      preview.style.position = 'fixed';
      preview.style.left = `${rect.left}px`;
      preview.style.top = `${rect.top}px`;
      preview.style.width = `${rect.width}px`;
      preview.style.height = `${rect.height}px`;
      preview.style.pointerEvents = 'none';
      preview.style.opacity = '0.8';
      preview.style.zIndex = '1000';
      document.body.appendChild(preview);

      let startX = touch.clientX - rect.left;
      let startY = touch.clientY - rect.top;

      const moveHandler = (moveEvent) => {
        const moveTouch = moveEvent.touches[0];
        preview.style.left = `${moveTouch.clientX - startX}px`;
        preview.style.top = `${moveTouch.clientY - startY}px`;
      };

      const endHandler = () => {
        document.body.removeChild(preview);
        document.removeEventListener('touchmove', moveHandler);
        document.removeEventListener('touchend', endHandler);
      };

      document.addEventListener('touchmove', moveHandler, { passive: false });
      document.addEventListener('touchend', endHandler);
    };

    return (
      <motion.div 
        ref={drag}
        initial={false}
        className="relative transform-gpu touch-manipulation"
        style={{
          touchAction: 'none',
          cursor: 'grab',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
        onTouchStart={handleTouchStart}
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
    <DndProvider backend={dndBackend} options={dndOptions}>
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
          isVisible={showPaymentSuccessfulOverlay.isVisible}
          playerName={showPaymentSuccessfulOverlay.playerName}
          targetName={showPaymentSuccessfulOverlay.targetName}
          selectedCards={showPaymentSuccessfulOverlay.selectedCards}
        />
        <PropertySwapOverlay
          animation={propertySwapAnimation}
          onComplete={() => setPropertySwapAnimation(null)}
          user={user}
        />
        <SlyDealModal
          isOpen={slyDealModalOpen}
          onClose={() => setSlyDealModalOpen(false)}
          opponentId={opponentId}
          opponentName={opponentName}
          opponentProperties={opponentProperties}
          onPropertySelect={(selectedProperty) => {
            handleSlyDealPropertySelect(selectedProperty, socket, user, pendingSlyDealCard, setPendingSlyDealCard);
            setSlyDealModalOpen(false);
          }}
        />
        <AnimatePresence>
          {propertyStealAnimation && (
            <PropertyStealOverlay
              animation={propertyStealAnimation}
              onComplete={() => setPropertyStealAnimation(null)}
              user={user}
            />
          )}
        </AnimatePresence>
        <ForcedDealModal
          isOpen={forcedDealModalOpen}
          onClose={() => {
            setForcedDealModalOpen(false);
            setPendingForcedDealCard(null);
          }}
          opponentId={Object.keys(opponentProperties)[0]}
          opponentName={opponentName}
          opponentProperties={opponentProperties}
          userProperties={playerProperties}
          onPropertySelect={handleForcedDealSelectWrapper}
        />
        <AnimatePresence>
          {dealBreakerModalOpen && (
            <DealBreakerModal
              isOpen={dealBreakerModalOpen}
              onClose={() => {
                setDealBreakerModalOpen(false);
                setPendingDealBreakerCard(null);
              }}
              opponentId={opponentId}
              opponentName={opponentName}
              opponentProperties={opponentProperties}
              onPropertySetSelect={handleDealBreakerSetSelectWrapper}
            />
          )}
        </AnimatePresence>
        <DealBreakerOverlay
          {...dealBreakerOverlay}
          onClose={() => setDealBreakerOverlay(prev => ({ ...prev, isVisible: false }))}
        />
        <DoubleRentOverlay
          isVisible={showDoubleRentOverlay}
          amount={doubleRentAmount}
          onResponse={handleDoubleRentResponseWrapper}
        />
        <WinnerOverlay isVisible={showWinnerOverlay} winner={winner} />
        <TieOverlay isVisible={showTieOverlay} />
        
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
              handleCardDrop={handleCardDropBankWrapper}
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
                onDrop={(item) => handleCardDropPropertyWrapper(item.card)}
              />
            </div>

            {/* Game Center */}
            <div className="flex-shrink-0">
              <GameCenter 
                numCardsInDrawPile={numCardsInDrawPile}
                lastAction={lastAction}
                renderCardContent={renderCardContent}
                ItemTypes={ItemTypes}
                handleCardDrop={handleCardDropActionWrapper}
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
              handleCardDrop={handleCardDropBankWrapper}
              DraggableCard={DraggableCard}
              renderCardContent={renderCardContent}
            />
          </div>
        </div>
      </div>
      <RentModal
        isOpen={rentModalOpen}
        onClose={() => {
          setRentModalOpen(false);
          setPendingRentCard(null);
        }}
        amountDue={rentAmount}
        recipientName={rentRecipientId === user.unique_id ? 'You' : opponentName}
        rentType={rentType}
        playerBank={playerBank}
        playerProperties={playerProperties}
        onPaymentSubmit={handleRentPaymentWrapper}
      />
    </DndProvider>
  );
};

export default MainGame;
