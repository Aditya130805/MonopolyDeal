import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useGameState } from '../contexts/GameStateContext';
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
import { handleWildPropertySelection } from '../utils/wildPropertyHandler';
import { handleRentColorSelection } from '../utils/rentActionHandler';
import { handleRentPayment, handleDoubleRentResponse } from './actions/RentActions';
import { handleSlyDealPropertySelect, handleForcedDealSelect, handleDealBreakerSetSelect } from './actions/PropertyActions';
import { handleCardDropBank, handleCardDropProperty, handleCardDropAction } from './actions/DropZoneHandlers';
import { handleWebSocketMessage } from './actions/WebSocketHandlers';
import { setRequirements, splitProperties, getPlayerById, getOpponentPlayers, findJustSayNoInHand } from '../utils/gameUtils';

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
  DraggableCard, renderCardContent, user
}) => {
  if (!gameState?.players?.length) return null;
  const player = gameState.players.find(p => p.id === user.unique_id);
  const opponent = gameState.players.find(p => p.id !== user.unique_id);
  if (!player || !opponent) return null;

  return (
    <>
      {/* Opponent's Area */}
      <div className="w-full">
        <BankAndCards
          hand={opponent.hand}
          bank={opponent.bank}
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
            properties={player.properties}
            isOpponent={false}
            ItemTypes={ItemTypes}
            onDrop={(item) => handleCardDropPropertyWrapper(item.card)}
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
          />
        </div>
      </div>

      {/* Player's Area */}
      <div className="w-full">
        <BankAndCards 
          hand={player.hand}
          bank={player.bank}
          isOpponent={false}
          ItemTypes={ItemTypes}
          handleCardDrop={handleCardDropBankWrapper}
          DraggableCard={DraggableCard}
          renderCardContent={renderCardContent}
        />
      </div>
    </>
  );
});

const TurnDisplay = memo(({ 
  gameState, 
  user, 
  onSkipTurn 
}) => {
  const currentTurnPlayerId = gameState.current_turn;
  const currentTurnPlayer = gameState.players.find(p => p.id === currentTurnPlayerId);
  const currentTurnPlayerName = currentTurnPlayer ? currentTurnPlayer.name : '';

  return (
    <div className="absolute top-20 left-8" style={{ zIndex: 1000 }}>
      <div className="flex items-center gap-3">
        <div className={`text-lg font-semibold px-4 py-2 rounded-lg ${currentTurnPlayerId === user.unique_id ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {currentTurnPlayerId === user.unique_id ? "Your Turn" : `${currentTurnPlayerName}'s Turn`} #{4 - gameState.actions_remaining}
        </div>
        {currentTurnPlayerId === user.unique_id && (
          <button 
            onClick={onSkipTurn}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-gray-100 rounded-lg font-medium transition-colors"
          >
            Skip Turn
          </button>
        )}
      </div>
    </div>
  );
});

const MainGame = () => {  
  const { roomId } = useParams();
  const { socket } = useWebSocket();
  const { user } = useAuth();
  const { gameState, setGameState, setGameStateFromBackend } = useGameState();
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [userPlayer, setUserPlayer] = useState(null);
  const [opponentId, setOpponentId] = useState('');
  const [errors, setErrors] = useState([]);
  const [showActionAnimation, setShowActionAnimation] = useState({ visible: false, action: null, onComplete: null });
  const [cardNotifications, setCardNotifications] = useState([]);
  const cardNotificationTimeoutRef = useRef(null);
  const rentCollectionTimeoutRef = useRef(null);
  const isUserTurnRef = useRef(false);
  const [rentAmount, setRentAmount] = useState(0);
  const [doubleRentAmount, setDoubleRentAmount] = useState(0);

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

  ////////// OVERLAY DATA VARS
  const [winnerOverlayData, setWinnerOverlayData] = useState({ 
    isVisible: false, winner: ""
  });
  const [tieOverlayData, setTieOverlayData] = useState({ 
    isVisible: false 
  });
  const [rentCollectionOverlayData, setRentCollectionOverlayData] = useState({ 
    isVisible: false 
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
    isVisible: false, doubleRentAmount: 0, opponentId: ''
  });
  const [slyDealModalData, setSlyDealModalData] = useState({
    isVisible: false, card: null, opponentId: ''
  });
  const [forcedDealModalData, setForcedDealModalData] = useState({
    isVisible: false, card: null, opponentId: ''
  });
  const [dealBreakerModalData, setDealBreakerModalData] = useState({
    isVisible: false, card: null, opponentId: ''
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
    socket.onmessage = (event) => handleWebSocketMessage(event);
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

  const handleRentRequest = (data) => {
    if (data.recipient_id !== user.unique_id) {
      setRentModalData(prev => ({ ...prev, isVisible: true, opponentId: data.recipient_id, userId: user.unique_id, amountDue: data.amount, rentType: data.rent_type}))
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
        setRentCollectionOverlayData({ isVisible: true })
      }, 2000);
    }
  };

  const handleRentPaid = (data) => {
    // Clear any pending timeout for rent collection overlay
    if (rentCollectionTimeoutRef.current) {
      clearTimeout(rentCollectionTimeoutRef.current);
      rentCollectionTimeoutRef.current = null;
    }
    
    // Hide overlay for the player who requested rent
    setRentCollectionOverlayData({ isVisible: false });
    // Clear states since rent collection is complete
    setRentModalData(prev => ({ ...prev, isVisible: false, opponentId: null, userId: null, amountDue: 0, rentType: null}))
    setPaymentSuccessfulOverlayData({
      isVisible: true,
      playerId: data.player_id,
      targetId: data.recipient_id,
      selectedCards: data.selected_cards
    })
    // Hide overlay after 2 seconds
    setTimeout(() => {
      setPaymentSuccessfulOverlayData({ isVisible: false, playerId: '', targetId: '', selectedCards: []})
    }, 2000);
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
    const opponent = opponents[0]; // Since it's a 2-player game
    if (opponent) {
      setOpponentId(opponent.id);
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
          setJustSayNoChoiceWaitingOverlayData({
            isVisible: false,
            playerId: ""
          })
          setJustSayNoModalData({
            isVisible: false,
            playerId: "",
            opponentId: "",
            againstCard: null,
            againstRentCard: null,
            card: null,
            data: null
          });
          if (data.playJustSayNo) {
            setJustSayNoPlayedOverlayData({
              isVisible: true,
              playerId: data.playerId,
              opponentId: data.opponentId,
              againstCard: data.againstCard,
              justSayNoCard: data.card
            })

            // Hide the overlay after 3 seconds
            setTimeout(() => {
              setJustSayNoPlayedOverlayData({
                isVisible: false,
                playerId: "",
                opponentId: "",
                againstCard: null,
                justSayNoCard: null
              })
            }, 3000);
          }
          break;

        case 'just_say_no_choice':
          setJustSayNoPlayedOverlayData({
            isVisible: false,
            playerId: "",
            opponentId: "",
            againstCard: null,
            justSayNoCard: null
          })
          
          if (data.playerId === user.unique_id) {
            setJustSayNoModalData({
              isVisible: true,
              playerId: data.playerId,
              opponentId: data.opponentId,
              againstCard: data.againstCard,
              againstRentCard: data.againstRentCard,
              card: data.card,
              data: data.data
            });
            setJustSayNoChoiceWaitingOverlayData({
              isVisible: false,
              playerId: ""
            });
          } else {
            setJustSayNoChoiceWaitingOverlayData({
              isVisible: true,
              playerId: data.playerId
            });
            // Clear the modal when showing waiting overlay
            setJustSayNoModalData({
              isVisible: false,
              playerId: "",
              opponentId: "",
              againstCard: null,
              againstRentCard: null,
              card: null,
              data: null
            });
          }
          break;

        case 'card_played':
          handleCardPlayed(data);
          break;

        case 'rent_request':
          handleRentRequest(data);
          break;

        case 'rent_paid':
          handleRentPaid(data);
          break;

        case 'property_stolen':
          setPropertyStealOverlayData({
            isVisible: true,
            property: data.property,
            stealerId: data.player_id,
            targetId: data.target_id,
          })
          break;

        case 'property_swap':
          setPropertySwapOverlayData({
            isVisible: true,
            property1: data.property1,
            property2: data.property2,
            player1Id: data.player1_id,
            player2Id: data.player2_id
          });
          break;

        case 'deal_breaker_overlay':
          setDealBreakerOverlayData({
            isVisible: true,
            stealerId: data.stealerId,
            targetId: data.targetId,
            color: data.color,
            propertySet: data.property_set
          })
          break;

        case 'game_update':
          handleGameUpdate(data);
          break;
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  //////////////////// ACTION USE EFFECTS
  useEffect(() => {
    if (pendingHouseCard) {
      handleHousePlacement(pendingHouseCard, userPlayer.properties, setError, socket, user);
      setPendingHouseCard(null);
    }
  }, [pendingHouseCard]);
  useEffect(() => {
    if (pendingHotelCard) {
      handleHotelPlacement(pendingHotelCard, userPlayer.properties, setError, socket, user);
      setPendingHotelCard(null);
    }
  }, [pendingHotelCard])
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
  }, [pendingPassGoCard]);
  useEffect(() => {
    if (pendingItsYourBirthdayCard) {
      const opponent = gameState.players.find(p => p.id === opponentId);
      const justSayNoCard = findJustSayNoInHand(gameState, opponent.id);
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
  }, [pendingItsYourBirthdayCard]);
  useEffect(() => {
    if (pendingDebtCollectorCard) {
      const opponent = gameState.players.find(p => p.id === opponentId);
      const justSayNoCard = findJustSayNoInHand(gameState, opponent.id);
      const debtCollectorActionData = JSON.stringify({
        action: "debt_collector",
        player: userPlayer.id,
        card: pendingDebtCollectorCard
      });
      if (justSayNoCard) {
        socket.send(JSON.stringify({
          action: "just_say_no_choice",
          playerId: opponentId,
          opponentId: userPlayer.id,
          card: justSayNoCard,
          againstCard: pendingDebtCollectorCard,
          data: debtCollectorActionData
        }))
      }
      else {
        setShowActionAnimation({ visible: true, action: "Debt Collector" });
        setTimeout(() => {
          setShowActionAnimation({ visible: false, action: '' });
        }, 2000);
        socket.send(debtCollectorActionData);
      }
      setPendingDebtCollectorCard(null);
    }
  }, [pendingDebtCollectorCard]);
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

      const handleRentColorSelect = (color, rentAmount) => {
        setRentAmount(rentAmount);

        // Check for double rent card
        const hasDoubleRentCard = userPlayer.hand.some(card => 
          card.type === 'action' && card.name.toLowerCase() === 'double the rent'
        );

        if (hasDoubleRentCard && gameState.actions_remaining > 1) {
          setDoubleRentAmount(rentAmount * 2);
          setDoubleRentModalData({
            isVisible: true,
            doubleRentAmount: rentAmount * 2,
            opponentId: opponentId
          });
        } else {
          const opponent = gameState.players.find(p => p.id === opponentId);
          const justSayNoCard = findJustSayNoInHand(gameState, opponent.id);
          const rentActionData = JSON.stringify({
            'action': 'rent',
            'player': userPlayer.id,
            'card': pendingRentCard,
            'rentColor': color,
            'rentAmount': rentAmount
          });
          if (justSayNoCard) {
            socket.send(JSON.stringify({
              action: "just_say_no_choice",
              playerId: opponentId,
              opponentId: userPlayer.id,
              card: justSayNoCard,
              againstCard: pendingRentCard,
              data: rentActionData
            }));
          } else {
            setShowActionAnimation({ visible: true, action: "Rent Request" });
            setTimeout(() => {
              setShowActionAnimation(prev => ({ ...prev, visible: false }));
            }, 2000);
            socket.send(rentActionData);
          }
          setPendingRentCard(null);
        }
      };

      handleRentColorSelection(pendingRentCard, userPlayer.properties, handleRentColorSelect);
    }
  }, [pendingRentCard]);
  useEffect(() => {
    if (pendingSlyDealCard) {
      // Check if opponents have any properties at all
      const opponentPlayers = getOpponentPlayers(gameState, userPlayer.id);
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
        opponentId: opponentId
      });
    }
  }, [pendingSlyDealCard]);
  useEffect(() => {
    if (pendingForcedDealCard) {
      // Check if player has any properties to swap
      if (Object.keys(userPlayer.properties).length === 0) {
        setError("You don't have any properties to swap!");
        setPendingForcedDealCard(null);
        return;
      }

      const opponent = gameState.players.find(p => p.id === opponentId);

      // Check if opponents have any properties at all
      if (Object.keys(opponent.properties).length === 0) {
        setError("Opponent doesn't have any properties!");
        setPendingForcedDealCard(null);
        return;
      }

      // Split opponent's properties into main and overflow sets
      const { mainSets, overflowSets } = splitProperties(opponent.properties);

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

      setForcedDealModalData({
        isVisible: true,
        card: pendingForcedDealCard,
        opponentId: opponentId
      })
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
      const opponent = gameState.players.find(p => p.id === opponentId);
      const hasCompleteSets = Object.entries(opponent.properties).some(([color, cards]) => isCompleteSet(color, cards));    
      
      if (!hasCompleteSets) {
        setError("Your opponent doesn't have any complete sets!");
        setPendingDealBreakerCard(null);
        return;
      }

      setDealBreakerModalData({
        isVisible: true,
        card: pendingDealBreakerCard,
        opponentId: opponentId
      });
    }
  }, [pendingDealBreakerCard]);

  // Handle sly deal property selection
  const handleSlyDealPropertySelectWrapper = (modalData, selectedProperty) => {
    const opponent = gameState.players.find(p => p.id === modalData.opponentId);
    const card = modalData.card;
    const justSayNoCard = findJustSayNoInHand(gameState, opponent.id);
    const slyDealActionData = JSON.stringify({
      action: 'sly_deal',
      player: user.unique_id,
      card: pendingSlyDealCard,
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
    const opponent = gameState.players.find(p => p.id === modalData.opponentId);
    const card = modalData.card;
    const justSayNoCard = findJustSayNoInHand(gameState, opponent.id);
    const forcedDealActionData = JSON.stringify({
      action: 'forced_deal',
      player: user.unique_id,
      card: pendingForcedDealCard,
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
      }))
    } else {
      socket.send(forcedDealActionData);
    }
    setForcedDealModalData(prev => ({ ...prev, isVisible: false }));
    setPendingForcedDealCard(null);
  };

  // Handle deal breaker set selection
  const handleDealBreakerSetSelectWrapper = (modalData, selectedSet) => {
    const opponent = gameState.players.find(p => p.id === modalData.opponentId);
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
    setDoubleRentModalData({ isVisible: false, doubleRentAmount: 0, opponentId: '' });
    const opponent = gameState.players.find(p => p.id === modalData.opponentId);
    const justSayNoCard = findJustSayNoInHand(gameState, opponent.id);
    
    if (useDoubleRent) {
      const doubleTheRentCard = userPlayer.hand.find(card => 
        card.type === 'action' && card.name.toLowerCase() === 'double the rent'
      );
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
    } else {
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
        }))
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
      'player': user.unique_id
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
            opponentId: doubleRentModalData.opponentId,
          }}
          handleDoubleRentResponse={handleDoubleRentResponseWrapper}
          
          slyDealModalOpen={slyDealModalData.isVisible}
          setSlyDealModalData={setSlyDealModalData}
          slyDealModalData={{
            opponentId: slyDealModalData.opponentId,
            card: slyDealModalData.card,
          }}
          handleSlyDealPropertySelect={handleSlyDealPropertySelectWrapper}
          
          forcedDealModalOpen={forcedDealModalData.isVisible}
          setForcedDealModalData={setForcedDealModalData}
          forcedDealModalData={{
            opponentId: forcedDealModalData.opponentId,
            userId: user.unique_id,
            card: forcedDealModalData.card,
          }}
          handleForcedDealPropertySelect={handleForcedDealSelectWrapper}
          
          dealBreakerModalOpen={dealBreakerModalData.isVisible}
          setDealBreakerModalData={setDealBreakerModalData}
          dealBreakerModalData={{
            opponentId: dealBreakerModalData.opponentId,
            card: dealBreakerModalData.card,
          }}
          handleDealBreakerPropertySetSelect={handleDealBreakerSetSelectWrapper}

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
        />
        
        {/* Game Layout */}
        <div className="flex flex-col justify-between h-[calc(100vh-4rem)] py-32 px-8 overflow-hidden bg-gray-200">
          {/* Turn Display */}
          <TurnDisplay 
            gameState={gameState}
            user={user}
            onSkipTurn={handleSkipTurn}
          />
          <TwoPlayerLayout 
            gameState={gameState}
            ItemTypes={ItemTypes}
            handleCardDropBankWrapper={handleCardDropBankWrapper}
            handleCardDropPropertyWrapper={handleCardDropPropertyWrapper}
            handleCardDropActionWrapper={handleCardDropActionWrapper}
            DraggableCard={DraggableCard}
            renderCardContent={renderCardContent}
            user={user}
          />
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
