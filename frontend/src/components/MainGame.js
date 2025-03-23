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
import { rentActionAnimationNames, setRequirements, splitProperties, getPlayerById, getOpponentPlayers, findJustSayNoInHand } from '../utils/gameUtils';
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
            playerId={opponent.id}
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
            playerId={player.id}
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
            playerId={opponent.id}
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
          properties={player.properties}
          playerId={player.id}
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
          playerId={player.id}
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
  const [playerDisconnectedOverlayData, setPlayerDisconnectedOverlayData] = useState({ isVisible: false, playerId: '', username: '' });
  const gameEndedRef = useRef(false);

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
  const [pendingRentPreRequestData, setPendingRentPreRequestData] = useState(null);
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
    isVisible: false, message: "", currentPaymentIndex: 0, totalPayments: 0
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
    isVisible: false, doubleRentAmount: 0, opponentIds: '', type: '', card: null, color: '', rentAmount: 0
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
    console.log("Card played:", data);
    
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
      gameEndedRef.current = true;
      setWinnerOverlayData({ isVisible: true, winner: state.winner });
    } else if (state.deck_count === 0) {
      // Check if all players' hands are empty
      const allHandsEmpty = state.players.every(player => player.hand.length === 0);
      if (allHandsEmpty) {
        gameEndedRef.current = true;
        setTieOverlayData({ isVisible: true });
      }
    }
  };

  const handlePlayerDisconnected = (data) => {
    // Only show player disconnected overlay if the game hasn't already ended
    if (!gameEndedRef.current) {
      setPlayerDisconnectedOverlayData({ isVisible: true, playerId: data.player_id, username: data.username });
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

        case 'rent_pre_request':
          setPendingRentPreRequestData(data);
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

        case 'player_disconnected':
          handlePlayerDisconnected(data);
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
      const birthdayActionData = JSON.stringify({
        action: "it's_your_birthday",
        player: userPlayer.id,
        card: pendingItsYourBirthdayCard
      })
      setShowActionAnimation({ visible: true, action: rentActionAnimationNames["it's your birthday"] });
      setTimeout(() => {
        setShowActionAnimation({ visible: false, action: '' });
        socket.send(birthdayActionData);
      }, 2000);
      console.log("SENDING FRONTEND -> BACKEND:", birthdayActionData)
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
    console.log("Received PendingJustSayNoChoiceData:", data);
    // setJustSayNoPlayedOverlayData({ 
    //   isVisible: false, playerId: "", opponentId: "", againstCard: null, justSayNoCard: null 
    // })
    if (data.playerId === user.unique_id) {
      setJustSayNoModalData({
        isVisible: true, playerId: data.playerId, opponentId: data.opponentId, againstCard: data.againstCard, againstRentCard: data.againstRentCard, card: data.card, data: data.data
      });
      setJustSayNoChoiceWaitingOverlayData({
        isVisible: false, playerId: ""
      });
    } 
    // else if (data.opponentId === user.unique_id) {
    //   setJustSayNoChoiceWaitingOverlayData({
    //     isVisible: true, playerId: data.playerId
    //   });
    //   setJustSayNoModalData({
    //     isVisible: false, playerId: "", opponentId: "", againstCard: null, againstRentCard: null, card: null, data: null
    //   });
    // } 
    else {
      setJustSayNoChoiceWaitingOverlayData({
        isVisible: true, playerId: data.playerId
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
    if (!pendingRentPreRequestData) return;
    const data = pendingRentPreRequestData;
    console.log("Received PendingRentPreRequestData:", data);
    const justSayNoCard = findJustSayNoInHand(gameState, data.target_player_id);
    const rentRequestData = {
      action: 'rent_request',
      rentAmount: data.amount,
      // rentType: data.rent_type,
      player: data.recipient_id,
      // recipientId: data.recipient_id,
      targetPlayerId: data.target_player_id,
      // totalPlayers: data.total_players,
      // numPlayersOwing: data.num_players_owing,
      card: data.card
    }
    if (justSayNoCard) {
      console.log("Sending just_say_no_choice FRONTEND -> BACKEND:", {
        action: "just_say_no_choice",
        playerId: data.target_player_id,
        opponentId: data.recipient_id,
        card: justSayNoCard,
        againstCard: data.card,
        data: JSON.stringify(rentRequestData)
      });
      socket.send(JSON.stringify({
        action: "just_say_no_choice",
        playerId: data.target_player_id,
        opponentId: data.recipient_id,
        card: justSayNoCard,
        againstCard: data.card,
        data: JSON.stringify(rentRequestData)
      }))
    } else {
      console.log("Sending rent_request FRONTEND -> BACKEND:", rentRequestData);
      socket.send(JSON.stringify(rentRequestData));
    }
    setPendingRentPreRequestData(null);
  }, [pendingRentPreRequestData, gameState])
  useEffect(() => {
    if (!pendingRentRequestData) return;
    const data = pendingRentRequestData;
    console.log("PendingRentRequestData:", data);
    if (data.recipient_id === user.unique_id) {
      console.log("Else if true: recipient, some owing");
      setRentCollectionOverlayData({ isVisible: true, message: "Waiting for " + gameState.players.find(p => p.id === data.target_player_id).name + " to pay...", currentPaymentIndex: data.total_players - data.num_players_owing + 1, totalPayments: data.total_players })
    } else if (data.target_player_id === user.unique_id) {
      console.log("Else if true: target");
      console.log(data);
      setRentModalData({ isVisible: true, opponentId: data.recipient_id, userId: user.unique_id, amountDue: data.amount, rentType: data.rent_type })
    } else {
      console.log("Else true: not recipient, not target");
      setRentCollectionOverlayData({ isVisible: true, message: "Waiting for " + gameState.players.find(p => p.id === data.target_player_id).name + " to pay...", currentPaymentIndex: data.total_players - data.num_players_owing + 1, totalPayments: data.total_players })
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

    setPaymentSuccessfulOverlayData({
      isVisible: true,
      playerId: data.player_id,
      targetId: data.recipient_id,
      selectedCards: data.selected_cards
    });
    
    // Hide overlay after 2 seconds
    setTimeout(() => {
      setPaymentSuccessfulOverlayData({ isVisible: false, playerId: '', targetId: '', selectedCards: []})
      // Clear any pending timeout for rent collection overlay
      console.log("Clearing timeout for rent collection overlay");
      console.log("Current timeout:", rentCollectionTimeoutRef.current);
      if (rentCollectionTimeoutRef.current) {
        clearTimeout(rentCollectionTimeoutRef.current);
        rentCollectionTimeoutRef.current = null;
      }
      console.log("Current timeout after clearing:", rentCollectionTimeoutRef.current);
      setRentCollectionOverlayData({ isVisible: false, message: "", currentPaymentIndex: 0, totalPayments: 0 });
      console.log("Rent collection overlay set to false");
      console.log("Rent collection overlay data:", rentCollectionOverlayData);
      if (user.unique_id === data.player_id) {
        const rentPaidData = {
          action: 'rent_paid',
          recipient_id: data.recipient_id,
          player_id: data.player_id,
          selected_cards: data.selected_cards
        }
        console.log("Sending rent paid data:", rentPaidData);
        socket.send(JSON.stringify(rentPaidData));
      }
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
    setDoubleRentModalData({ isVisible: false, doubleRentAmount: 0, opponentIds: '', type: '', card: null, color: '', rentAmount: 0 });
    // Rent
    if (pendingRentCard.type === 'action' && pendingRentCard.name.toLowerCase() === 'rent') {
      // const targetPlayers = modalData.opponentIds.map(id => gameState.players.find(p => p.id === id));
      if (useDoubleRent) {
        const doubleTheRentCard = userPlayer.hand.find(card => 
          card.type === 'action' && card.name.toLowerCase() === 'double the rent'
        );
        const doubleRentActionData = {
          'action': 'double_the_rent',
          'player': userPlayer.id,
          'card': pendingRentCard,
          'double_the_rent_card': doubleTheRentCard,
          'rentAmount': doubleRentAmount
        };
        setShowActionAnimation({ visible: true, action: rentActionAnimationNames['double_the_rent'] });
        setTimeout(() => {
          setShowActionAnimation({ visible: false, action: null });
          socket.send(JSON.stringify(doubleRentActionData));
        }, 2000);
        // targetPlayers.forEach(opponent => {
        // const justSayNoCard = findJustSayNoInHand(gameState, opponent.id);
          // if (justSayNoCard) {
          //   socket.send(JSON.stringify({
          //     action: "just_say_no_choice",
          //     playerId: opponent.id,
          //     opponentId: userPlayer.id,
          //     card: justSayNoCard,
          //     againstCard: doubleTheRentCard,
          //     againstRentCard: pendingRentCard,
          //     data: JSON.stringify(doubleRentActionData)
          //   }))
          // } else {
          //   socket.send(doubleRentActionData);
          // }
        // })
      }
      else {
        // targetPlayers.forEach(opponent => {
        const rentActionData = {
          'action': 'rent',
          'player': user.unique_id,
          'card': pendingRentCard,
          'rentAmount': rentAmount
        };
        setShowActionAnimation({ visible: true, action: rentActionAnimationNames['rent'] });
        setTimeout(() => {
          setShowActionAnimation({ visible: false, action: '' });
          socket.send(JSON.stringify(rentActionData));
        }, 2000);
        setPendingRentCard(null);
          // if (justSayNoCard) {
          //   socket.send(JSON.stringify({
          //     action: "just_say_no_choice",
          //     playerId: opponent.id,
          //     opponentId: userPlayer.id,
          //     card: justSayNoCard,
          //     againstCard: pendingRentCard,
          //     data: rentActionData
          //   }));
          // } else {
          //   setShowActionAnimation({ visible: true, action: rentActionAnimationNames['rent'] });
          //   setTimeout(() => {
          //     setShowActionAnimation({ visible: false, action: '' });
          //     socket.send(rentActionData);
          //   }, 2000);
          //   setPendingRentCard(null);
          // }
        // })
      }
      setPendingRentCard(null);
    }
    // Multicolor Rent
    else {
      if (useDoubleRent) {
        const doubleTheRentCard = userPlayer.hand.find(card => 
          card.type === 'action' && card.name.toLowerCase() === 'double the rent'
        );
        const doubleRentActionData = {
          'action': 'double_the_rent',
          'player': userPlayer.id,
          'card': pendingRentCard,
          'double_the_rent_card': doubleTheRentCard,
          'rentAmount': doubleRentAmount
        };
        setOpponentSelectionModalData({
          isVisible: true,
          opponentIds: modalData.opponentIds,
          type: modalData.type,
          onSelect: (selectedOpponentId) => {
            // Now we have both color and opponent, send to backend
            doubleRentActionData.targetPlayer = selectedOpponentId;
            const justSayNoCard = findJustSayNoInHand(gameState, selectedOpponentId);
            if (justSayNoCard) {
              const justSayNoActionData = {
                action: "just_say_no_choice",
                playerId: selectedOpponentId,
                opponentId: userPlayer.id,
                card: justSayNoCard,
                againstCard: pendingRentCard,
                againstRentCard: doubleTheRentCard,
                data: JSON.stringify(doubleRentActionData)
              };
              socket.send(JSON.stringify(justSayNoActionData));
            } else {
              socket.send(JSON.stringify(doubleRentActionData));
            }
            // Clear all pending states
            setPendingRentCard(null);
            setOpponentSelectionModalData(prev => ({ ...prev, isVisible: false }));
          },
          onCancel: () => {
            // Clear everything on cancel
            setPendingRentCard(null);
            setOpponentSelectionModalData(prev => ({ ...prev, isVisible: false }));
          }
        })
      }
      else {
        setOpponentSelectionModalData({
          isVisible: true,
          opponentIds: modalData.opponentIds,
          type: modalData.type,
          onSelect: (selectedOpponentId) => {
            // Now we have both color and opponent, send to backend
            const multicolorRentActionData = {
              'action': 'multicolor rent',
              'player': userPlayer.id,
              'card': modalData.card,
              'rentColor': modalData.color,
              'rentAmount': modalData.rentAmount,
              'targetPlayer': selectedOpponentId
            };
            const justSayNoCard = findJustSayNoInHand(gameState, selectedOpponentId);
            if (justSayNoCard) {
              const justSayNoActionData = {
                action: "just_say_no_choice",
                playerId: selectedOpponentId,
                opponentId: userPlayer.id,
                card: justSayNoCard,
                againstCard: modalData.card,
                data: JSON.stringify(multicolorRentActionData)
              };
              socket.send(JSON.stringify(justSayNoActionData));
            } else {
              socket.send(JSON.stringify(multicolorRentActionData));
            }
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
      }
    }
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
          .map(p => p.id),
        type: 'rent',
        card: card,
        color: color,
        rentAmount: rentAmount
      });
    } else {
      // const targetPlayers = pendingRentTarget 
      //   ? [gameState.players.find(p => p.id === pendingRentTarget)]
      //   : gameState.players.filter(p => p.id !== user.unique_id);

      // console.log("Target Players:", targetPlayers);

      // Send rent request
      const rentActionData = JSON.stringify({
        'action': 'rent',
        'player': userPlayer.id,
        'card': card,
        // 'rentColor': color,
        'rentAmount': rentAmount,
        // 'targetPlayers': targetPlayers.map(p => p.id)
      });
      setShowActionAnimation({ visible: true, action: rentActionAnimationNames['rent'] });
      setTimeout(() => {
        setShowActionAnimation(prev => ({ ...prev, visible: false }));
        socket.send(rentActionData);
      }, 2000);
      setPendingRentCard(null);
      setPendingRentTarget(null);
    }
  }, [gameState, socket]);

  const handleRentColorForMulticolor = (card, color, rentAmount) => {
    setRentAmount(rentAmount);
    // Show opponent selection after color is chosen
    const opponentIds = pendingRentTarget ? [pendingRentTarget] : gameState.players.filter(p => p.id !== user.unique_id).map(p => p.id);

    const hasDoubleRentCard = userPlayer.hand.some(card => 
      card.type === 'action' && card.name.toLowerCase() === 'double the rent'
    );
  
    if (hasDoubleRentCard && gameState.actions_remaining > 1) {
      setDoubleRentAmount(rentAmount * 2);
      setDoubleRentModalData({
        isVisible: true,
        doubleRentAmount: rentAmount * 2,
        opponentIds: opponentIds,
        type: 'multicolor rent',
        card: card,
        color: color,
        rentAmount: rentAmount
      });
    }
    else {
      setOpponentSelectionModalData({
        isVisible: true,
        opponentIds: opponentIds,
        type: 'multicolor rent',
        onSelect: (selectedOpponentId) => {
          // Now we have both color and opponent, send to backend
          const multicolorRentActionData = {
            'action': 'multicolor rent',
            'player': userPlayer.id,
            'card': card,
            'rentColor': color,
            'rentAmount': rentAmount,
            'targetPlayer': selectedOpponentId
          };
          const justSayNoCard = findJustSayNoInHand(gameState, selectedOpponentId);
          if (justSayNoCard) {
            const justSayNoActionData = {
              action: "just_say_no_choice",
              playerId: selectedOpponentId,
              opponentId: userPlayer.id,
              card: justSayNoCard,
              againstCard: card,
              data: JSON.stringify(multicolorRentActionData)
            };
            socket.send(JSON.stringify(justSayNoActionData));
          } else {
            socket.send(JSON.stringify(multicolorRentActionData));
          }
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
    }
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
        import('./overlays/WinnerOverlay'),
        import('./overlays/PlayerDisconnectedOverlay')
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

          playerDisconnectedOverlayData={playerDisconnectedOverlayData}
          setPlayerDisconnectedOverlayData={setPlayerDisconnectedOverlayData}
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
            type: doubleRentModalData.type,
            card: doubleRentModalData.card,
            color: doubleRentModalData.color,
            rentAmount: doubleRentModalData.rentAmount
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
