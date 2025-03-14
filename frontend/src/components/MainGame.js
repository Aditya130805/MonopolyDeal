import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useGameState } from '../contexts/GameStateContext';
import { useWebSocketMessageQueue } from '../contexts/WebSocketMessageQueue';
import Navbar from './auth/Navbar';
import MoneyCard from './cards/MoneyCard';
import PropertyCard from './cards/PropertyCard';
import ActionCard from './cards/ActionCard';
import BankAndCards from './game/BankAndCards';
import PropertySet from './game/PropertySet';
import GameCenter from './game/GameCenter';
import ActionAnimation from './overlays/ActionAnimation';
import CardNotification from './notifications/CardNotification';
import GameModals from './GameModals';
import ErrorNotification from './notifications/ErrorNotification';
import GameOverlays from './GameOverlays';
import { DndContext, TouchSensor, MouseSensor, useSensor, useSensors, useDraggable, DragOverlay } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { handleHousePlacement } from './actions/HousePlacement';
import { handleHotelPlacement } from './actions/HotelPlacement';
import { handleRentColorSelection } from '../utils/rentActionHandler';
import { handleCardDropBank, handleCardDropProperty, handleCardDropAction } from './actions/DropZoneHandlers';
import { setRequirements, splitProperties, getPlayerById, getOpponentPlayers, findJustSayNoInHand } from '../utils/gameUtils';
import PlayerInfo from './game/PlayerInfo';

const DraggableCard = memo(({ card, children }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: card
  });

  return (
    <motion.div 
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      initial={false}
      className="relative transform-gpu"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        transform: isDragging ? 'none' : undefined
      }}
    >
      {children}
    </motion.div>
  );
});

const TwoPlayerLayout = memo(({
  gameState, ItemTypes, handleCardDropBankWrapper, handleCardDropPropertyWrapper, handleCardDropActionWrapper,
  DraggableCard, renderCardContent, user, onSkipTurn
}) => {
  if (!gameState?.players?.length) return null;
  const player = gameState.players.find(p => p.id === user.unique_id);
  const opponent = gameState.players.find(p => p.id !== user.unique_id);
  if (!player || !opponent) return null;

  return (
    <div className="h-full flex flex-col items-center justify-center relative">
      {/* Top section with Turn Display and Opponent's Area */}
      <div className="w-full absolute top-0">
        {/* Turn Display at top left */}
        <div className="absolute left-2 top-2 z-10">
          <TurnDisplay 
            gameState={gameState}
            user={user}
            onSkipTurn={onSkipTurn}
          />
        </div>

        {/* Opponent's Area */}
        <div className="w-full absolute -top-9">
          <BankAndCards
            hand={opponent.hand}
            bank={opponent.bank}
            isOpponent={true}
            ItemTypes={ItemTypes}
            DraggableCard={DraggableCard}
            renderCardContent={renderCardContent}
          />
        </div>
      </div>

      {/* Center Area with Property Sets */}
      <div className="w-full flex justify-between items-center gap-6">
        {/* Left Property Set */}
        <div className="flex-1">
          <PropertySet 
            properties={player.properties}
            isOpponent={false}
            ItemTypes={ItemTypes}
            onDrop={(item) => handleCardDropPropertyWrapper(item.card)}
            setsPerRow={4}
            className="main-property-set"
          />
        </div>

        {/* Game Center */}
        <div className="flex-shrink-0">
          <GameCenter 
            numCardsInDrawPile={gameState.deck_count}
            lastAction={gameState.discard_pile ? gameState.discard_pile[gameState.discard_pile.length - 1] : null}
            renderCardContent={renderCardContent}
            ItemTypes={ItemTypes}
            handleCardDrop={handleCardDropActionWrapper}
          />
        </div>

        {/* Right Property Set */}
        <div className="flex-1">
          <PropertySet 
            properties={opponent.properties}
            isOpponent={true}
            setsPerRow={4}
          />
        </div>
      </div>

      {/* Player's Area */}
      <div className="absolute -bottom-9 w-full">
        <BankAndCards
          hand={player.hand}
          bank={player.bank}
          isOpponent={false}
          ItemTypes={ItemTypes}
          DraggableCard={DraggableCard}
          renderCardContent={renderCardContent}
        />
      </div>
    </div>
  );
});

const ThreePlayerLayout = memo(({
  gameState, ItemTypes, handleCardDropActionWrapper,
  DraggableCard, renderCardContent, user, onSkipTurn
}) => {
  if (!gameState?.players?.length) return null;
  const player = gameState.players.find(p => p.id === user.unique_id);
  const opponents = gameState.players.filter(p => p.id !== user.unique_id);
  if (!player || opponents.length !== 2) return null;

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Top Opponents - Positioned absolutely */}
      <div className="absolute top-2 left-4 w-72 z-10">
        <PlayerInfo 
          player={opponents[0]}
          color="red"
        />
      </div>
      
      <div className="absolute top-2 right-4 w-72 z-10">
        <PlayerInfo 
          player={opponents[1]}
          color="blue"
        />
      </div>

      {/* Game Center with Turn Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center -translate-y-24">
        <div className="mb-4">
          <TurnDisplay 
            gameState={gameState}
            user={user}
            onSkipTurn={onSkipTurn}
          />
        </div>
        <GameCenter 
          numCardsInDrawPile={gameState.deck_count}
          lastAction={gameState.discard_pile ? gameState.discard_pile[gameState.discard_pile.length - 1] : null}
          renderCardContent={renderCardContent}
          ItemTypes={ItemTypes}
          handleCardDrop={handleCardDropActionWrapper}
        />
      </div>

      {/* Bottom Player - Fixed at bottom with more space */}
      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-full px-4">
        <BankAndCards
          hand={player.hand}
          bank={player.bank}
          properties={player.properties}
          isOpponent={false}
          DraggableCard={DraggableCard}
          renderCardContent={renderCardContent}
          isThreePlayer={true}
        />
      </div>
    </div>
  );
});

const TurnDisplay = memo(({ 
  gameState, 
  user, 
  onSkipTurn,
  className = ''
}) => {
  const isUserTurn = gameState.current_turn === user.unique_id;
  const currentPlayer = gameState.players.find(p => p.id === gameState.current_turn);
  
  if (!currentPlayer) return null;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`
        px-6 py-3 rounded-xl shadow-lg backdrop-blur-sm
        ${isUserTurn ? 'bg-green-100/90 border-2 border-green-400' : 'bg-gray-100/90 border-2 border-gray-300'}
        transform transition-all duration-300 hover:scale-105
      `}>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <span className={`font-bold text-lg ${isUserTurn ? 'text-green-800' : 'text-gray-700'}`}>
              {isUserTurn ? "Your Turn!" : `${currentPlayer.name}'s Turn`}
            </span>
            <span className={`ml-2 px-2 py-0.5 rounded-lg text-lg font-medium ${
              isUserTurn ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700'
            }`}>
              #{4 - gameState.actions_remaining}
            </span>
          </div>
          {isUserTurn && (
            <button
              onClick={onSkipTurn}
              className="ml-2 px-3 py-1 bg-green-300 hover:bg-green-400 text-green-800 rounded-lg font-medium text-sm transition-colors"
            >
              Skip Turn
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

const MainGame = () => {  
  const { roomId } = useParams();
  const { socket } = useWebSocket();
  const { user } = useAuth();
  const { gameState, setGameState, setGameStateFromBackend } = useGameState();
  const { enqueueMessage } = useWebSocketMessageQueue();
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [userPlayer, setUserPlayer] = useState(null);
  const [opponentIds, setOpponentIds] = useState([]);
  const [errors, setErrors] = useState([]);
  const [showActionAnimation, setShowActionAnimation] = useState({ visible: false, action: null, onComplete: null });
  const [cardNotifications, setCardNotifications] = useState([]);
  const cardNotificationTimeoutRef = useRef(null);
  const rentCollectionTimeoutRef = useRef(null);
  const isUserTurnRef = useRef(false);
  const [rentAmount, setRentAmount] = useState(0);
  const [doubleRentAmount, setDoubleRentAmount] = useState(0);
  const [pendingRentTarget, setPendingRentTarget] = useState(null);

  ////////// PENDING CARDS VARS
  const [pendingHouseCard, setPendingHouseCard] = useState(null);
  const [pendingHotelCard, setPendingHotelCard] = useState(null);
  const [pendingPassGoCard, setPendingPassGoCard] = useState(null);
  const [pendingItsYourBirthdayCard, setPendingItsYourBirthdayCard] = useState(null);
  const [pendingDebtCollectorCard, setPendingDebtCollectorCard] = useState(null);
  const [pendingRentCard, setPendingRentCard] = useState(null);
  const [pendingSlyDealCard, setPendingSlyDealCard] = useState(null);
  const [pendingForcedDealCard, setPendingForcedDealCard] = useState(null);
  const [pendingDealBreakerCard, setPendingDealBreakerCard] = useState(null);
  const [pendingJustSayNoChoiceData, setPendingJustSayNoChoiceData] = useState(null);
  const [pendingJustSayNoResponseData, setPendingJustSayNoResponseData] = useState(null);
  const [pendingRentRequestData, setPendingRentRequestData] = useState(null);
  const [pendingRentPaidData, setPendingRentPaidData] = useState(null);
  const [pendingPropertyStealData, setPendingPropertyStealData] = useState(null);
  const [pendingPropertySwapData, setPendingPropertySwapData] = useState(null);
  const [pendingDealBreakerData, setPendingDealBreakerData] = useState(null);

  ////////// OVERLAY DATA VARS
  const [winnerOverlayData, setWinnerOverlayData] = useState({ 
    isVisible: false, winner: ""
  });
  const [tieOverlayData, setTieOverlayData] = useState({ 
    isVisible: false 
  });
  const [rentCollectionOverlayData, setRentCollectionOverlayData] = useState({ 
    isVisible: false, message: ""
  });
  const [justSayNoChoiceWaitingOverlayData, setJustSayNoChoiceWaitingOverlayData] = useState({ 
    isVisible: false, playerId: "" 
  });
  const [justSayNoPlayedOverlayData, setJustSayNoPlayedOverlayData] = useState({
    isVisible: false, playerId: "", opponentId: "", againstCard: null, justSayNoCard: null
  });
  const [paymentSuccessfulOverlayData, setPaymentSuccessfulOverlayData] = useState({
    isVisible: false, playerId: '', targetId: '', selectedCards: []
  });
  const [propertyStealOverlayData, setPropertyStealOverlayData] = useState({
    isVisible: false, property: null, stealerId: '', targetId: ''
  });
  const [propertySwapOverlayData, setPropertySwapOverlayData] = useState({
    isVisible: false, property1: null, property2: null, player1Id: '', player2Id: ''
  });
  const [dealBreakerOverlayData, setDealBreakerOverlayData] = useState({
    isVisible: false, stealerId: '', targetId: '', color: '', propertySet: []
  });

  ////////// MODAL DATA VARS
  const [justSayNoModalData, setJustSayNoModalData] = useState({
    isVisible: false, playerId: "", opponentId: "", againstCard: null, againstRentCard: null, card: null, data: null
  });
  const [rentModalData, setRentModalData] = useState({
    isVisible: false, opponentId: null, userId: null, amountDue: 0, rentType: null
  });
  const [doubleRentModalData, setDoubleRentModalData] = useState({
    isVisible: false, doubleRentAmount: 0, opponentIds: ''
  });
  const [slyDealModalData, setSlyDealModalData] = useState({
    isVisible: false, card: null, opponentIds: []
  });
  const [forcedDealModalData, setForcedDealModalData] = useState({
    isVisible: false, card: null, opponentIds: []
  });
  const [dealBreakerModalData, setDealBreakerModalData] = useState({
    isVisible: false, card: null, opponentIds: []
  });

  const [opponentSelectionModalData, setOpponentSelectionModalData] = useState({
    isVisible: false, opponentIds: [], type: '', onSelect: null, onCancel: null
  });

  const [rentPaymentTracker, setRentPaymentTracker] = useState({
    totalPlayers: 0,
    playersPaid: new Set(),
  });

  useEffect(() => {
    return () => {
      if (cardNotificationTimeoutRef.current) {
        clearTimeout(cardNotificationTimeoutRef.current);
      }
    };
  }, []);

  //////////////////// CHECK IF IT'S USER'S TURN
  useEffect(() => {
    isUserTurnRef.current = gameState.current_turn === user.unique_id;
  }, [gameState, user.unique_id]);

  //////////////////// CONSTANTS
  const ItemTypes = {
    CARD: 'card'
  };

  //////////////////// SOCKET HANDLING
  useEffect(() => {
    if (!socket) {
        console.log("Socket is null; waiting for WebSocket connection.");
      return;
    }
    console.log("(Socket 2) Connected:", socket);
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

  // WebSocket message handlers
  const handleCardPlayed = (data) => {
    // Clear any existing timeout
    if (cardNotificationTimeoutRef.current) {
      clearTimeout(cardNotificationTimeoutRef.current);
    }
    
    // Add new card notification
    const newNotification = {
      id: Date.now(),
      card: data.card,
      visible: true,
      actionType: data.action_type
    };
    
    setCardNotifications(prev => [...prev, newNotification]);
  };

  const handleGameUpdate = (data) => {
    const state = data.state;
    setGameState(setGameStateFromBackend(state));
    
    // Use state directly instead of gameState since it's the new data
    const currentPlayer = state.players.find(p => p.id === user.unique_id);
    if (currentPlayer) {
      setUserPlayer(currentPlayer);
    }
    
    // Find opponents and update their hands
    const opponents = state.players.filter(p => p.id !== user.unique_id);
    if (opponents) {
      setOpponentIds(opponents.map(opponent => opponent.id));
    }

    // Handle winner or tie
    if (state.winner) {
      setWinnerOverlayData({ isVisible: true, winner: state.winner });
    } else if (state.deck_count === 0) {
      // Check if all players' hands are empty
      const allHandsEmpty = state.players.every(player => player.hand.length === 0);
      if (allHandsEmpty) {
        setTieOverlayData({ isVisible: true });
      }
    }
  };

  const handleWebSocketMessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'just_say_no_response':
          setPendingJustSayNoResponseData(data);
          break;

        case 'just_say_no_choice':
          setPendingJustSayNoChoiceData(data);
          break;

        case 'card_played':
          handleCardPlayed(data);
          break;

        case 'rent_request':
          setPendingRentRequestData(data);
          break;

        case 'rent_paid':
          setPendingRentPaidData(data);
          break;

        case 'property_stolen':
          setPendingPropertyStealData(data);
          break;

        case 'property_swap':
          setPendingPropertySwapData(data);
          break;

        case 'deal_breaker_overlay':
          setPendingDealBreakerData(data);
          break;

        case 'game_update':
          handleGameUpdate(data);
          break;
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        // Instead of processing directly, enqueue the message
        enqueueMessage(event, handleWebSocketMessage);
      };
    }
  }, [socket, enqueueMessage]);

  //////////////////// ACTION USE EFFECTS
  useEffect(() => {
    if (pendingHouseCard) {
      handleHousePlacement(pendingHouseCard, userPlayer.properties, setError, socket, user);
      setPendingHouseCard(null);
    }
  }, [pendingHouseCard, gameState]);
  useEffect(() => {
    if (pendingHotelCard) {
      handleHotelPlacement(pendingHotelCard, userPlayer.properties, setError, socket, user);
      setPendingHotelCard(null);
    }
  }, [pendingHotelCard, gameState])
  useEffect(() => {
    if (pendingPassGoCard) {
      if (2 - 1 + userPlayer.hand.length - (gameState.actions_remaining - 1) > 7) {
        setError('Pass Go cannot be played as it will exceed the 7-card limit');
        setPendingPassGoCard(null);
        return;
      }
      setShowActionAnimation({ visible: true, action: 'pass_go' });
      setTimeout(() => {
        setShowActionAnimation(prev => ({ ...prev, visible: false }));
      }, 2000);
      socket.send(JSON.stringify({
        'action': 'pass_go',
        'player': userPlayer.id,
        'card': pendingPassGoCard
      }));
      setPendingPassGoCard(null);
    }
  }, [pendingPassGoCard, gameState]);
  useEffect(() => {
    if (pendingItsYourBirthdayCard) {
      // const opponent = gameState.players.find(p => p.id === opponentId);
      // const opponentPlayers = gameState.players.filter(p => p.id !== userPlayer.id);
      // const justSayNoCard = findJustSayNoInHand(gameState, opponent.id);
      const justSayNoCard = null;
      const birthdayActionData = JSON.stringify({
        action: "it's_your_birthday",
        player: userPlayer.id,
        card: pendingItsYourBirthdayCard
      })
      if (justSayNoCard) {
        socket.send(JSON.stringify({
          action: "just_say_no_choice",
          playerId: opponentId,
          opponentId: userPlayer.id,
          card: justSayNoCard,
          againstCard: pendingItsYourBirthdayCard,
          data: birthdayActionData
        }))
      } else {
        setShowActionAnimation({ visible: true, action: "It's Your Birthday!" });
        setTimeout(() => {
          setShowActionAnimation({ visible: false, action: '' });
        }, 2000);
        socket.send(birthdayActionData);
      }
      setPendingItsYourBirthdayCard(null);
    }
  }, [pendingItsYourBirthdayCard, gameState]);
  useEffect(() => {
    if (pendingDebtCollectorCard) {
      setOpponentSelectionModalData({
        isVisible: true,
        opponentIds: opponentIds,
        type: 'debt_collector',
        onSelect: (selectedOpponentId) => {
          const opponent = gameState.players.find(p => p.id === selectedOpponentId);
          const justSayNoCard = findJustSayNoInHand(gameState, opponent.id);
          const debtCollectorActionData = JSON.stringify({
            action: "debt_collector",
            player: userPlayer.id,
            card: pendingDebtCollectorCard,
            targetPlayer: selectedOpponentId
          });

          if (justSayNoCard) {
            socket.send(JSON.stringify({
              action: "just_say_no_choice",
              playerId: selectedOpponentId,
              opponentId: userPlayer.id,
              card: justSayNoCard,
              againstCard: pendingDebtCollectorCard,
              data: debtCollectorActionData
            }));
          } else {
            socket.send(debtCollectorActionData);
            setShowActionAnimation({ visible: true, action: "Debt Collector" });
            setTimeout(() => {
              setShowActionAnimation({ visible: false, action: '' });
            }, 2000);
          }
          setPendingDebtCollectorCard(null);
          setOpponentSelectionModalData(prev => ({ ...prev, isVisible: false }));
        },
        onCancel: () => {
          setPendingDebtCollectorCard(null);
          setOpponentSelectionModalData(prev => ({ ...prev, isVisible: false }));
        }
      });
    }
  }, [pendingDebtCollectorCard, gameState]);
  useEffect(() => {
    if (pendingRentCard) {
      let hasMatchingProperties = false;
      for (let rentColor of pendingRentCard.rentColors) {
        for (let [color, cards] of Object.entries(userPlayer.properties)) {
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
      // Handle different rent types
      if (pendingRentCard.name.toLowerCase() === 'rent') {
        // Everyone pays - proceed directly to rent calculation
        handleRentColorSelection(pendingRentCard, userPlayer.properties, handleRentColorSelect);
      } else if (pendingRentCard.name.toLowerCase() === 'multicolor rent') { //Multicolor rent
        // Show color selection first, using our new handler that will then show opponent selection
        handleRentColorSelection(pendingRentCard, userPlayer.properties, handleRentColorForMulticolor);
      }
    }
  }, [pendingRentCard, gameState]);
  useEffect(() => {
    if (pendingSlyDealCard) {
      // Check if opponents have any properties at all
      const opponentPlayers = gameState.players.filter(player => opponentIds.includes(player.id));
      let opponentsHaveProperties = false;
      for (const player of opponentPlayers) {
        if (Object.keys(player.properties).length > 0) {
          opponentsHaveProperties = true;
          break;
        }
      }
      if (!opponentsHaveProperties) {
        setError("Opponents don't have any properties!");
        setPendingSlyDealCard(null);
        return;
      }

      // Check if there are any stealable properties
      let hasStealableProperties = false;

      // Check main sets for incomplete sets
      for (const player of opponentPlayers) {
        // Split opponent's properties into main and overflow sets
        const { mainSets, overflowSets } = splitProperties(player.properties);
        for (const [color, cards] of Object.entries(mainSets)) {
          const propertyCards = cards.filter(card => card.type === 'property');
          if (propertyCards.length < setRequirements[color]) {
            // If main set is incomplete, we can steal from it
            hasStealableProperties = true;
            break;
          }
        }
        if (hasStealableProperties) break;
        // If no stealable properties in main sets, check overflow sets
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
        if (hasStealableProperties) break;
      }

      if (!hasStealableProperties) {
        setError("Opponents have no properties that can be stolen!");
        setPendingSlyDealCard(null);
        return;
      }

      setSlyDealModalData({
        isVisible: true,
        card: pendingSlyDealCard,
        opponentIds: opponentIds,
      });
    }
  }, [pendingSlyDealCard, gameState]);
  useEffect(() => {
    if (pendingForcedDealCard) {
      // Check if player has any properties to swap
      if (Object.keys(userPlayer.properties).length === 0) {
        setError("You don't have any properties to swap!");
        setPendingForcedDealCard(null);
        return;
      }

      // const opponent = gameState.players.find(p => p.id === opponentId);
      const opponentPlayers = gameState.players.filter(player => opponentIds.includes(player.id));
      let opponentsHaveProperties = false;
      for (const player of opponentPlayers) {
        if (Object.keys(player.properties).length > 0) {
          opponentsHaveProperties = true;
          break;
        }
      }
      if (!opponentsHaveProperties) {
        setError("Opponents don't have any properties!");
        setPendingSlyDealCard(null);
        return;
      }

      // Check if there are any stealable properties
      let hasStealableProperties = false;

      // Check main sets for incomplete sets
      for (const player of opponentPlayers) {
        // Split opponent's properties into main and overflow sets
        const { mainSets, overflowSets } = splitProperties(player.properties);
        for (const [color, cards] of Object.entries(mainSets)) {
          const propertyCards = cards.filter(card => card.type === 'property');
          if (propertyCards.length < setRequirements[color]) {
            // If main set is incomplete, we can steal from it
            hasStealableProperties = true;
            break;
          }
        }
        if (hasStealableProperties) break;
        // If no stealable properties in main sets, check overflow sets
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
        if (hasStealableProperties) break;
      }

      if (!hasStealableProperties) {
        setError("Opponents have no properties that can be stolen!");
        setPendingForcedDealCard(null);
        return;
      }
      
      setForcedDealModalData({
        isVisible: true,
        card: pendingForcedDealCard,
        opponentIds: opponentIds
      })
    }
  }, [pendingForcedDealCard, gameState]);
  useEffect(() => {
    if (pendingDealBreakerCard) { 
      const isCompleteSet = (color, cards) => {
        if (!Array.isArray(cards)) return false;
        const requiredCards = setRequirements[color] || 0;
        return cards.length >= requiredCards;
      };

      const opponentPlayers = gameState.players.filter(p => opponentIds.includes(p.id));

      let hasCompleteSets = false;
      for (const player of opponentPlayers) {
        if (Object.entries(player.properties).some(([color, cards]) => isCompleteSet(color, cards))) {
          hasCompleteSets = true;
          break;
        }    
      }
      if (!hasCompleteSets) {
        setError("Opponents don't have any complete sets!");
        setPendingDealBreakerCard(null);
        return;
      }
    
      setDealBreakerModalData({
        isVisible: true,
        card: pendingDealBreakerCard,
        opponentIds: opponentIds
      });
    }
  }, [pendingDealBreakerCard, gameState]);
  useEffect(() => {
    if (!pendingJustSayNoChoiceData) return;
    const data = pendingJustSayNoChoiceData;
    setJustSayNoPlayedOverlayData({ 
      isVisible: false, playerId: "", opponentId: "", againstCard: null, justSayNoCard: null 
    })
    if (data.playerId === user.unique_id) {
      setJustSayNoModalData({
        isVisible: true, playerId: data.playerId, opponentId: data.opponentId, againstCard: data.againstCard, againstRentCard: data.againstRentCard, card: data.card, data: data.data
      });
      setJustSayNoChoiceWaitingOverlayData({
        isVisible: false, playerId: ""
      });
    } else if (data.opponentId === user.unique_id) {
      setJustSayNoChoiceWaitingOverlayData({
        isVisible: true, playerId: data.playerId
      });
      setJustSayNoModalData({
        isVisible: false, playerId: "", opponentId: "", againstCard: null, againstRentCard: null, card: null, data: null
      });
    } else {
      setJustSayNoChoiceWaitingOverlayData({
        isVisible: false, playerId: ""
      });
      setJustSayNoModalData({
        isVisible: false, playerId: "", opponentId: "", againstCard: null, againstRentCard: null, card: null, data: null
      });
    }
    setPendingJustSayNoChoiceData(null);
  }, [pendingJustSayNoChoiceData, gameState])
  useEffect(() => {
    if (!pendingJustSayNoResponseData) return;
    const data = pendingJustSayNoResponseData;
    setJustSayNoChoiceWaitingOverlayData({
      isVisible: false, playerId: ""
    })
    setJustSayNoModalData({
      isVisible: false, playerId: "", opponentId: "", againstCard: null, againstRentCard: null, card: null, data: null
    });
    if (data.playJustSayNo) {
      setTimeout(() => {
        setJustSayNoPlayedOverlayData({
          isVisible: true, playerId: data.playerId, opponentId: data.opponentId, againstCard: data.againstCard, justSayNoCard: data.card
        })
      }, 0);
      // Hide the overlay after 3 seconds
      setTimeout(() => {
        setJustSayNoPlayedOverlayData({
          isVisible: false, playerId: "", opponentId: "", againstCard: null, justSayNoCard: null
        })
      }, 3000);
    }
    setPendingJustSayNoResponseData(null);
  }, [pendingJustSayNoResponseData, gameState]);
  useEffect(() => {
    if (!pendingRentRequestData) return;
    console.log("pendingRentRequestData: ", pendingRentRequestData);
    const data = pendingRentRequestData;
    if (data.players_to_pay) {
      console.log("Total paying players: ", data.total_players);
      // Initialize the payment tracker for multi-player rent
      setRentPaymentTracker({
        totalPlayers: data.total_players,
        playersPaid: new Set(),
      });
    }
    if (data.recipient_id !== user.unique_id) {
      // TODO: Handle different instances differently (if you want to)

      /* if (data.rent_type === "debt collector" || data.rent_type === "multicolor rent") {
      //   if (data.target_player_id === user.unique_id) {
      //     setRentModalData({ isVisible: true, opponentId: data.recipient_id, userId: user.unique_id, amountDue: data.amount, rentType: data.rent_type })
      //   } else {
      //     // TODO: Show waiting overlay saying x demanded y rent from z via action a, waiting for player z to pay.
      //   }
      // } else if (data.rent_type === "it's your birthday" || data.rent_type === "rent") {
      //   setRentModalData({ isVisible: true, opponentId: data.recipient_id, userId: user.unique_id, amountDue: data.amount, rentType: data.rent_type })
      // } */
      setRentModalData({ isVisible: true, opponentId: data.recipient_id, userId: user.unique_id, amountDue: data.amount, rentType: data.rent_type })
    } else {
      // Show rent animation first for the player who played the rent card
      setShowActionAnimation({
        visible: true,
        action: data.rent_type === "it's your birthday" ? 'Birthday Request' :
                data.rent_type === "debt collector" ? 'Debt Request' :
                data.rent_type === "double_the_rent" ? 'Double Rent Request' :
                'Rent Request'
      });
      // Wait 2 seconds then start transitioning
      rentCollectionTimeoutRef.current = setTimeout(() => {
        // Hide action animation (will trigger fade out)
        setShowActionAnimation(prev => ({ ...prev, visible: false }));
        // Show rent collection overlay
        setRentCollectionOverlayData({ isVisible: true, message: "Collecting rent..." })
      }, 2000);
    }
    setPendingRentRequestData(null);
  }, [pendingRentRequestData, gameState])
  useEffect(() => {
    if (!pendingRentPaidData) return;
    const data = pendingRentPaidData;
    // Only clear rent modal if the current user is the one who paid
    if (data.player_id === user.unique_id) {
      console.log("Clearing rent modal")
      setRentModalData({ isVisible: false, opponentId: null, userId: null, amountDue: 0, rentType: null });
    }

    // Update the payment tracker
    setRentPaymentTracker(prev => {
      const newPlayersPaid = new Set(prev.playersPaid);
      newPlayersPaid.add(data.player_id);
      
      // Only clear the collection overlay if everyone has paid
      console.log("Players paid: ", newPlayersPaid.size, "Total players: ", prev.totalPlayers);
      if (newPlayersPaid.size >= prev.totalPlayers) {
        // Clear any pending timeout for rent collection overlay
        if (rentCollectionTimeoutRef.current) {
          clearTimeout(rentCollectionTimeoutRef.current);
          rentCollectionTimeoutRef.current = null;
        }
        setRentCollectionOverlayData({ isVisible: false, message: "" });
        return { playersPaid: new Set(), totalPlayers: 0 };
      } else {
        // Check if the current user has paid
        if (newPlayersPaid.has(user.unique_id)) {
          console.log("User has paid");
          // Show waiting overlay with names of players who haven't paid
          // Get the current players from gameState
          const unpaidPlayerIds = gameState.players
            .filter(player => !newPlayersPaid.has(player.id))
            .filter(player => player.id !== data.recipient_id)
            .map(player => player.id)
            .join(", ");
          const unpaidPlayerNames = gameState.players
            .filter(player => !newPlayersPaid.has(player.id))
            .filter(player => player.id !== data.recipient_id)
            .map(player => player.name)
            .join(", ");

          if (unpaidPlayerIds) {
            setRentCollectionOverlayData({
              isVisible: true,
              message: `Waiting for player(s) to pay: ${unpaidPlayerNames}`
            });
          }
        }
        return { ...prev, playersPaid: newPlayersPaid };
      }
    });
    
    setPaymentSuccessfulOverlayData({
      isVisible: true,
      playerId: data.player_id,
      targetId: data.recipient_id,
      selectedCards: data.selected_cards
    });
    
    // Hide overlay after 2 seconds
    setTimeout(() => {
      setPaymentSuccessfulOverlayData({ isVisible: false, playerId: '', targetId: '', selectedCards: []})
    }, 2000);
    setPendingRentPaidData(null);
  }, [pendingRentPaidData, gameState])
  useEffect(() => {
    if (!pendingPropertyStealData) return;
    const data = pendingPropertyStealData;
    setPropertyStealOverlayData({
      isVisible: true,
      property: data.property,
      stealerId: data.player_id,
      targetId: data.target_id,
    })
    setPendingPropertyStealData(null);
  }, [pendingPropertyStealData, gameState])
  useEffect(() => {
    if (!pendingPropertySwapData) return;
    const data = pendingPropertySwapData;
    setPropertySwapOverlayData({
      isVisible: true,
      property1: data.property1,
      property2: data.property2,
      player1Id: data.player1_id,
      player2Id: data.player2_id
    });
    setPendingPropertySwapData(null);
  }, [pendingPropertySwapData, gameState])
  useEffect(() => {
    if (!pendingDealBreakerData) return;
    const data = pendingDealBreakerData;
    setDealBreakerOverlayData({
      isVisible: true,
      stealerId: data.stealerId,
      targetId: data.targetId,
      color: data.color,
      propertySet: data.property_set
    })
    setPendingDealBreakerData(null);
  }, [pendingDealBreakerData, gameState])

  // Handle sly deal property selection
  const handleSlyDealPropertySelectWrapper = (modalData, selectedProperty) => {
    const opponent = gameState.players.find(p => p.id === selectedProperty.ownerId);
    const card = modalData.card;
    const justSayNoCard = findJustSayNoInHand(gameState, opponent.id);
    const slyDealActionData = JSON.stringify({
      action: 'sly_deal',
      player: user.unique_id,
      card: card,
      target_property: selectedProperty
    });
    if (justSayNoCard) {
      socket.send(JSON.stringify({
        action: "just_say_no_choice",
        playerId: opponent.id,
        opponentId: userPlayer.id,
        card: justSayNoCard,
        againstCard: card,
        data: slyDealActionData
      }))
    }
    else {
      socket.send(slyDealActionData);
    }
    setSlyDealModalData(prev => ({ ...prev, isVisible: false }));
    setPendingSlyDealCard(null);
  };

  // Handle forced deal property selection
  const handleForcedDealSelectWrapper = (modalData, opponentProperty, userProperty) => {
    const opponent = gameState.players.find(p => p.id === opponentProperty.ownerId);
    const card = modalData.card;
    const justSayNoCard = findJustSayNoInHand(gameState, opponent.id);
    const forcedDealActionData = JSON.stringify({
      action: 'forced_deal',
      player: user.unique_id,
      card: card,
      target_property: opponentProperty,
      user_property: userProperty
    });
    if (justSayNoCard) {
      socket.send(JSON.stringify({
        action: "just_say_no_choice",
        playerId: opponent.id,
        opponentId: userPlayer.id,
        card: justSayNoCard,
        againstCard: card,
        data: forcedDealActionData
      }));
    } else {
      socket.send(forcedDealActionData);
    }
    setForcedDealModalData(prev => ({ ...prev, isVisible: false }));
    setPendingForcedDealCard(null);
  };

  // Handle deal breaker set selection
  const handleDealBreakerSetSelectWrapper = (modalData, selectedSet) => {
    const opponent = gameState.players.find(p => p.id === selectedSet.ownerId);
    const card = modalData.card;
    const justSayNoCard = findJustSayNoInHand(gameState, opponent.id);
    const dealBreakerActionData = JSON.stringify({
      action: 'deal_breaker',
      player: user.unique_id,
      card: card,
      target_set: selectedSet.cards,
      target_color: selectedSet.color
    });
    if (justSayNoCard) {
      socket.send(JSON.stringify({
        action: "just_say_no_choice",
        playerId: opponent.id,
        opponentId: userPlayer.id,
        card: justSayNoCard,
        againstCard: card,
        data: dealBreakerActionData
      }));
    }
    else {
      socket.send(dealBreakerActionData);
    }
    setDealBreakerModalData(prev => ({ ...prev, isVisible: false }));
    setPendingDealBreakerCard(null);
  };

  // Handle double rent response
  const handleDoubleRentResponseWrapper = (modalData, useDoubleRent) => {
    setDoubleRentModalData({ isVisible: false, doubleRentAmount: 0, opponentIds: '' });
    const targetPlayers = modalData.opponentIds.map(id => gameState.players.find(p => p.id === id));
    if (useDoubleRent) {
      const doubleTheRentCard = userPlayer.hand.find(card => 
        card.type === 'action' && card.name.toLowerCase() === 'double the rent'
      );
      targetPlayers.forEach(opponent => {
        const justSayNoCard = findJustSayNoInHand(gameState, opponent.id);
        const doubleRentActionData = JSON.stringify({
          'action': 'double_the_rent',
          'player': userPlayer.id,
          'card': pendingRentCard,
          'double_the_rent_card': doubleTheRentCard,
          'rentAmount': doubleRentAmount
        });
        if (justSayNoCard) {
          socket.send(JSON.stringify({
            action: "just_say_no_choice",
            playerId: opponent.id,
            opponentId: userPlayer.id,
            card: justSayNoCard,
            againstCard: doubleTheRentCard,
            againstRentCard: pendingRentCard,
            data: doubleRentActionData
          }))
        } else {
          socket.send(doubleRentActionData);
        }
      })
    }
    else {
      targetPlayers.forEach(opponent => {
        const rentActionData = JSON.stringify({
          'action': 'rent',
          'player': user.unique_id,
          'card': pendingRentCard,
          'rentAmount': rentAmount
        });
        if (justSayNoCard) {
          socket.send(JSON.stringify({
            action: "just_say_no_choice",
            playerId: opponent.id,
            opponentId: userPlayer.id,
            card: justSayNoCard,
            againstCard: pendingRentCard,
            data: rentActionData
          }));
        } else {
          setTimeout(() => {
            setShowActionAnimation({ visible: true, action: "Rent Request" });
            setTimeout(() => {
              setShowActionAnimation({ visible: false, action: '' });
            }, 2000);
            socket.send(rentActionData);
            setPendingRentCard(null);
          }, 50);
        }
      })
    }
    setPendingRentCard(null);
  };

  // Handle rent payment
  const handleRentPaymentWrapper = (modalData, selectedCards) => {
    // handleRentPayment(selectedCards, socket, user, rentRecipientId);
    const message = {
      action: 'rent_payment',
      player: modalData.userId,
      recipient_id: modalData.opponentId,
      card: {
        selected_cards: selectedCards.map(card => card.id),
      }
    };
    socket.send(JSON.stringify(message));
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

  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  const sensors = useSensors(mouseSensor, touchSensor);

  const [activeCard, setActiveCard] = useState(null);
  const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setActiveCard(active.data.current);
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (over) {
      const card = active.data.current;
      if (over.id === 'bank') {
        handleCardDropBankWrapper(card);
      } else if (over.id === 'property-main' || over.id.startsWith('property-')) {
        handleCardDropPropertyWrapper(card);
      } else if (over.id === 'action') {
        handleCardDropActionWrapper(card);
      }
    }
    setActiveCard(null);
  }, [handleCardDropBankWrapper, handleCardDropPropertyWrapper, handleCardDropActionWrapper]);

  const handleDragCancel = useCallback(() => {
    setActiveCard(null);
  }, []);

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
    if (userPlayer.hand.length > 7) {
      setError('You cannot skip your turn when you have more than 7 cards in hand');
      return;
    }
    socket.send(JSON.stringify({
      'action': 'skip_turn',
      'player': userPlayer.id
    }));
  };

  const setError = (errorMessage) => {
    const newError = {
      id: Date.now(),
      message: errorMessage,
      timestamp: Date.now()
    };
    
    setErrors(prev => [...prev, newError]);
  };

  const handleRentColorSelect = useCallback((card, color, rentAmount) => {
    setRentAmount(rentAmount);

    const hasDoubleRentCard = userPlayer.hand.some(card => 
      card.type === 'action' && card.name.toLowerCase() === 'double the rent'
    );

    if (hasDoubleRentCard && gameState.actions_remaining > 1) {
      setDoubleRentAmount(rentAmount * 2);
      setDoubleRentModalData({
        isVisible: true,
        doubleRentAmount: rentAmount * 2,
        opponentIds: pendingRentTarget ? [pendingRentTarget] : gameState.players
          .filter(p => p.id !== user.unique_id)
          .map(p => p.id)
      });
    } else {
      const targetPlayers = pendingRentTarget 
        ? [gameState.players.find(p => p.id === pendingRentTarget)]
        : gameState.players.filter(p => p.id !== user.unique_id);

      // Check for Just Say No cards and send rent requests
      console.log("Target Players:", targetPlayers);
      targetPlayers.forEach(opponent => {
        const justSayNoCard = findJustSayNoInHand(gameState, opponent.id);
        const rentActionData = JSON.stringify({
          'action': 'rent',
          'player': userPlayer.id,
          'card': card,
          'rentColor': color,
          'rentAmount': rentAmount,
          'targetPlayer': opponent.id
        });

        if (justSayNoCard) {
          socket.send(JSON.stringify({
            action: "just_say_no_choice",
            playerId: opponent.id,
            opponentId: userPlayer.id,
            card: justSayNoCard,
            againstCard: card,
            data: rentActionData
          }));
        } else {
          socket.send(rentActionData);
        }
      });

      setShowActionAnimation({ visible: true, action: "Rent Request" });
      setTimeout(() => {
        setShowActionAnimation(prev => ({ ...prev, visible: false }));
      }, 2000);
      
      setPendingRentCard(null);
      setPendingRentTarget(null);
    }
  }, [gameState, socket]);

  const handleRentColorForMulticolor = (card, color, rentAmount) => {
    setRentAmount(rentAmount);
    // Show opponent selection after color is chosen
    const opponentIds = gameState.players
      .filter(player => player.id !== user.unique_id)
      .map(player => player.id);
    
    setOpponentSelectionModalData({
      isVisible: true,
      opponentIds: opponentIds,
      type: 'multicolor rent',
      onSelect: (selectedOpponentId) => {
        // Now we have both color and opponent, send to backend
        const multicolorRentActionData = JSON.stringify({
          'action': 'multicolor rent',
          'player': userPlayer.id,
          'card': card,
          'rentColor': color,
          'rentAmount': rentAmount,
          'targetPlayer': selectedOpponentId
        });
        socket.send(multicolorRentActionData);
        // Clear all pending states
        setPendingRentCard(null);
        setOpponentSelectionModalData(prev => ({ ...prev, isVisible: false }));
      },
      onCancel: () => {
        // Clear everything on cancel
        setPendingRentCard(null);
        setOpponentSelectionModalData(prev => ({ ...prev, isVisible: false }));
      }
    });
  };

  // Preload overlays and modals when game starts
  useEffect(() => {
    const preloadComponents = async () => {
      // Preload all overlay components
      const overlays = [
        import('./overlays/DealBreakerOverlay'),
        import('./overlays/JustSayNoChoiceWaitingOverlay'),
        import('./overlays/JustSayNoPlayedOverlay'),
        import('./overlays/PaymentSuccessfulOverlay'),
        import('./overlays/PropertyStealOverlay'),
        import('./overlays/PropertySwapOverlay'),
        import('./overlays/RentCollectionOverlay'),
        import('./overlays/TieOverlay'),
        import('./overlays/WinnerOverlay')
      ];

      // Preload all modal components
      const modals = [
        import('./modals/RentModal'),
        import('./modals/SlyDealModal'),
        import('./modals/ForcedDealModal'),
        import('./modals/DealBreakerModal'),
        import('./modals/JustSayNoModal'),
        import('./modals/DoubleRentModal')
      ];
      
      // Load all components in parallel
      await Promise.all([...overlays, ...modals]);
    };

    preloadComponents();
  }, []); // Only run once when component mounts

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        
        {/* Render stacked error notifications */}
        {errors.slice().reverse().map((error, index) => (
          <ErrorNotification 
            key={error.id}
            error={error.message}
            setError={() => {
              setErrors(prev => prev.filter(e => e.id !== error.id));
            }}
            index={index}
          />
        ))}
        {/* Render stacked card notifications */}
        {cardNotifications.slice().reverse().map((notification, index) => (
          <CardNotification
            key={notification.id}
            card={notification.card}
            isVisible={notification.visible}
            actionType={notification.actionType}
            onComplete={() => {
              setCardNotifications(prev => prev.filter(n => n.id !== notification.id));
            }}
            index={index}
          />
        ))}
        <ActionAnimation 
          action={showActionAnimation.action}
          isVisible={showActionAnimation.visible}
          onComplete={() => setShowActionAnimation({ visible: false, action: null })}
        />
        

        {/* Game Overlays */}
        <GameOverlays
          propertyStealOverlayData={propertyStealOverlayData}
          setPropertyStealOverlayData={setPropertyStealOverlayData}
          
          propertySwapOverlayData={propertySwapOverlayData}
          setPropertySwapOverlayData={setPropertySwapOverlayData}

          dealBreakerOverlayData={dealBreakerOverlayData}
          setDealBreakerOverlayData={setDealBreakerOverlayData}

          rentCollectionOverlayData={rentCollectionOverlayData}
          setRentCollectionOverlayData={setRentCollectionOverlayData}
          
          paymentSuccessfulOverlayData={paymentSuccessfulOverlayData}
          setPaymentSuccessfulOverlayData={setPaymentSuccessfulOverlayData}

          justSayNoChoiceWaitingOverlayData={justSayNoChoiceWaitingOverlayData}
          setJustSayNoChoiceWaitingOverlayData={setJustSayNoChoiceWaitingOverlayData}
          
          justSayNoPlayedOverlayData={justSayNoPlayedOverlayData}
          setJustSayNoPlayedOverlayData={setJustSayNoPlayedOverlayData}

          tieOverlayData={tieOverlayData}
          setTieOverlayData={setTieOverlayData}

          winnerOverlayData={winnerOverlayData}
          setWinnerOverlayData={setWinnerOverlayData}
        />

        {/* Game Modals */}
        <GameModals
          rentModalOpen={rentModalData.isVisible}
          setRentModalData={setRentModalData}
          rentModalData={{
            opponentId: rentModalData.opponentId,
            userId: rentModalData.userId,
            amountDue: rentModalData.amountDue,
            rentType: rentModalData.rentType,
          }}
          handleRentPayment={handleRentPaymentWrapper}

          doubleRentModalOpen={doubleRentModalData.isVisible}
          setDoubleRentModalData={setDoubleRentModalData}
          doubleRentModalData={{
            doubleRentAmount: doubleRentModalData.doubleRentAmount,
            opponentIds: doubleRentModalData.opponentIds,
          }}
          handleDoubleRentResponse={handleDoubleRentResponseWrapper}
          
          slyDealModalOpen={slyDealModalData.isVisible}
          setSlyDealModalData={setSlyDealModalData}
          slyDealModalData={{
            opponentIds: slyDealModalData.opponentIds,
            card: slyDealModalData.card,
          }}
          handleSlyDealPropertySelect={handleSlyDealPropertySelectWrapper}
          setPendingSlyDealCard={setPendingSlyDealCard}
          
          forcedDealModalOpen={forcedDealModalData.isVisible}
          setForcedDealModalData={setForcedDealModalData}
          forcedDealModalData={{
            opponentIds: forcedDealModalData.opponentIds,
            userId: user.unique_id,
            card: forcedDealModalData.card,
          }}
          handleForcedDealPropertySelect={handleForcedDealSelectWrapper}
          setPendingForcedDealCard={setPendingForcedDealCard}
          
          dealBreakerModalOpen={dealBreakerModalData.isVisible}
          setDealBreakerModalData={setDealBreakerModalData}
          dealBreakerModalData={{
            opponentIds: dealBreakerModalData.opponentIds,
            card: dealBreakerModalData.card,
          }}
          handleDealBreakerPropertySetSelect={handleDealBreakerSetSelectWrapper}
          setPendingDealBreakerCard={setPendingDealBreakerCard}

          justSayNoModalOpen={justSayNoModalData.isVisible}
          setJustSayNoModalData={setJustSayNoModalData}
          justSayNoModalData={{
            playerId: justSayNoModalData.playerId,
            opponentId: justSayNoModalData.opponentId,
            againstCard: justSayNoModalData.againstCard,
            againstRentCard: justSayNoModalData.againstRentCard,
            card: justSayNoModalData.card,
            data: justSayNoModalData.data
          }}
          handleJustSayNoResponse={() => {}}
          
          opponentSelectionModalOpen={opponentSelectionModalData.isVisible}
          opponentSelectionModalData={{
            isVisible: opponentSelectionModalData.isVisible,
            opponentIds: opponentSelectionModalData.opponentIds,
            type: opponentSelectionModalData.type,
            onSelect: opponentSelectionModalData.onSelect,
            onCancel: opponentSelectionModalData.onCancel
          }}
          setOpponentSelectionModalData={setOpponentSelectionModalData}
        />
        
        {/* Game Layout */}
        <div className="flex flex-col justify-between h-[calc(100vh-4rem)] px-4 overflow-hidden bg-gray-200">
          {gameState.players.length === 2 ? (
            <TwoPlayerLayout 
              gameState={gameState}
              ItemTypes={ItemTypes}
              handleCardDropBankWrapper={handleCardDropBankWrapper}
              handleCardDropPropertyWrapper={handleCardDropPropertyWrapper}
              handleCardDropActionWrapper={handleCardDropActionWrapper}
              DraggableCard={DraggableCard}
              renderCardContent={renderCardContent}
              user={user}
              onSkipTurn={handleSkipTurn}
            />
          ) : (
            <ThreePlayerLayout 
              gameState={gameState}
              ItemTypes={ItemTypes}
              handleCardDropActionWrapper={handleCardDropActionWrapper}
              DraggableCard={DraggableCard}
              renderCardContent={renderCardContent}
              user={user}
              onSkipTurn={handleSkipTurn}
            />
          )}
        </div>
      </div>
    <DragOverlay dropAnimation={null}>
      {activeCard ? (
        <div style={{ 
          transition: 'opacity 0.2s ease-in-out',
          opacity: 1,
          transform: !isTouchDevice ? 'translateY(-3rem)' : undefined
        }}>
          {renderCardContent(activeCard)}
        </div>
      ) : null}
    </DragOverlay>
  </DndContext>
  );
};

export default MainGame;
