import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
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
import GameModals from './GameModals';
import ErrorNotification from './notifications/ErrorNotification';
import RentCollectionOverlay from './overlays/RentCollectionOverlay';
import PaymentSuccessfulOverlay from './overlays/PaymentSuccessfulOverlay';
import PropertyStealOverlay from './overlays/PropertyStealOverlay';
import PropertySwapOverlay from './overlays/PropertySwapOverlay';
import DealBreakerOverlay from './overlays/DealBreakerOverlay';
import DoubleRentOverlay from './overlays/DoubleRentOverlay';
import WinnerOverlay from './overlays/WinnerOverlay';
import TieOverlay from './overlays/TieOverlay';
import JustSayNoChoiceWaitingOverlay from './overlays/JustSayNoChoiceWaitingOverlay';
import JustSayNoPlayedOverlay from './overlays/JustSayNoPlayedOverlay';
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
import { createEmptyGameState, createPlayerState, setGameStateFromBackend } from '../types/gameState';
import { setRequirements, splitProperties, getCurrentPlayer, getOpponentPlayers, getOpponentById } from '../utils/gameUtils';

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
  currentTurnPlayerId, 
  currentTurnPlayerName, 
  actionsRemaining, 
  userId, 
  onSkipTurn 
}) => (
  <div className="absolute top-20 left-8" style={{ zIndex: 1000 }}>
    <div className="flex items-center gap-3">
      <div className={`text-lg font-semibold px-4 py-2 rounded-lg ${currentTurnPlayerId === userId ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
        {currentTurnPlayerId === userId ? "Your Turn" : `${currentTurnPlayerName}'s Turn`} #{4 - actionsRemaining}
      </div>
      {currentTurnPlayerId === userId && (
        <button 
          onClick={onSkipTurn}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-gray-100 rounded-lg font-medium transition-colors"
        >
          Skip Turn
        </button>
      )}
    </div>
  </div>
));

const MainGame = () => {  
  const { roomId } = useParams();
  const { socket } = useWebSocket();
  const { user } = useAuth();
  const [isSocketReady, setIsSocketReady] = useState(false);
  // const [hoveredCard, setHoveredCard] = useState(null);
  const [gameState, setGameState] = useState(createEmptyGameState());
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
  const [errors, setErrors] = useState([]);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState('');
  const [currentTurnPlayerName, setCurrentTurnPlayerName] = useState('');
  const [actionsRemaining, setActionsRemaining] = useState(3);
  const [showActionAnimation, setShowActionAnimation] = useState({ visible: false, action: null, onComplete: null });
  const [cardNotifications, setCardNotifications] = useState([]);
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
  const [forcedDealModalData, setForcedDealModalData] = useState({
    isVisible: false,
    gameState: null,
    card: null,
    opponentId: ''
  })
  const [rentAmount, setRentAmount] = useState(0);
  const [rentRecipientId, setRentRecipientId] = useState(null);
  const [rentType, setRentType] = useState(null);
  const [showPaymentSuccessfulOverlay, setShowPaymentSuccessfulOverlay] = useState({
    isVisible: false,
    playerName: '',
    targetName: '',
    selectedCards: []
  });
  const [slyDealModalData, setSlyDealModalData] = useState({
    isVisible: false,
    gameState: null,
    card: null,
    opponentId: '',
  })
  const [dealBreakerModalData, setDealBreakerModalData] = useState({
    isVisible: false,
    gameState: null,
    card: null,
    opponentId: '',
  })
  const [propertyStealAnimation, setPropertyStealAnimation] = useState(null);
  const [propertySwapAnimation, setPropertySwapAnimation] = useState(null);
  const [dealBreakerOverlay, setDealBreakerOverlay] = useState({
    isVisible: false,
    playerName: '',
    targetName: '',
    color: '',
    propertySet: []
  });
  const [showDoubleRentOverlay, setShowDoubleRentOverlay] = useState({
    isVisible: false,
    doubleRentAmount: 0,
    opponentHand: []
  })
  const [doubleRentAmount, setDoubleRentAmount] = useState(0);

  // State for rent modal
  const [rentModalOpen, setRentModalOpen] = useState(false);
  // const [rentModalData, setRentModalData] = useState({
  //   isVisible: false,
  //   gameState: null,
  //   opponentId: null,
  //   userId: null,
  //   card: null,
  //   amountDue: 0,
  //   // recipientName: opponentName,
  //   rentType: null,
  //   // playerBank: playerBank,
  //   // playerProperties: playerProperties,
  // })

  const [winner, setWinner] = useState(null);
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
  const [showTieOverlay, setShowTieOverlay] = useState(false);
  const [showJustSayNoChoiceWaitingOverlay, setShowJustSayNoChoiceWaitingOverlay] = useState({
    isVisible: false,
    playerName: ""
  });
  const [showJustSayNoPlayedOverlay, setShowJustSayNoPlayedOverlay] = useState({
    isVisible: false,
    playingPlayerName: "",
    againstPlayerName: "",
    actionCard: null
  });
  const [showJustSayNoModal, setShowJustSayNoModal] = useState({
    isVisible: false,
    playingPlayer: "",
    againstPlayer: "",
    playingPlayerName: "",
    againstPlayerName: "",
    againstCard: null,
    againstRentCard: null,
    card: null,
    data: null
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
    isUserTurnRef.current = currentTurnPlayerId === user.unique_id;
  }, [currentTurnPlayerId, user.unique_id]);

  //////////////////// CONSTANTS
  const ItemTypes = {
    CARD: 'card'
  };

  //////////////////// PROPERTIES INTO MAIN SETS AND OVERFLOW SETS
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
    setRentAmount(data.amount);
    setRentRecipientId(data.recipient_id);
    setRentType(data.rent_type);
    
    if (data.recipient_id !== user.unique_id) {
      // setRentModalData(prev => ({ ...prev, isVisible: true, opponentId: data.recipient_id, amountDue: data.amount, rentType: data.rent_type}))
      setRentModalOpen(true);
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
        setShowRentCollectionOverlay(true);
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
    setShowRentCollectionOverlay(false);
    // Clear states since rent collection is complete
    // setRentModalData({...prev, isVisible: false, gameState: null, card: null, opponentId: null, amountDue: 0, rentType: null})
    setRentModalOpen(false);
    setRentAmount(0);
    setRentRecipientId(null);
    setRentType(null);
    setShowPaymentSuccessfulOverlay({
      isVisible: true,
      playerName: data.player_name,
      targetName: data.recipient_name,
      selectedCards: data.selected_cards
    });
    // Hide overlay after 2 seconds
    setTimeout(() => {
      setShowPaymentSuccessfulOverlay({
        isVisible: false,
        playerName: '',
        targetName: '',
        selectedCards: []
      });
    }, 2000);
  };

  const handleGameUpdate = (data) => {
    const state = data.state;
    console.log("Received state:", state);
    setGameState(setGameStateFromBackend(state));
    
    // Use state directly instead of gameState since it's the new data
    const currentPlayer = state.players.find(p => p.id === user.unique_id);
    if (currentPlayer) {
      setPlayerHand(currentPlayer.hand);
      setPlayerBank(currentPlayer.bank);
      setPlayerProperties(currentPlayer.properties);
    }
    
    // Find opponents and update their hands
    const opponents = state.players.filter(p => p.id !== user.unique_id);
    const opponent = opponents[0]; // Since it's a 2-player game
    if (opponent) {
      setOpponentId(opponent.id);
      setOpponentName(opponent.name);
      setOpponentHand(opponent.hand);
      setOpponentBank(opponent.bank);
      setOpponentProperties(opponent.properties);
    }
    
    setNumCardsInDrawPile(state.deck_count);
    setLastAction(state.discard_pile ? state.discard_pile[state.discard_pile.length - 1] : null);
    
    // Convert current turn ID to username  
    setCurrentTurnPlayerId(state.current_turn);
    const currentTurnPlayer = state.players.find(p => p.id === state.current_turn);
    setCurrentTurnPlayerName(currentTurnPlayer ? currentTurnPlayer.name : '');
    setActionsRemaining(state.actions_remaining || 0);

    // Handle winner or tie
    if (state.winner) {
      setWinner(state.winner);
      setShowWinnerOverlay(true);
    } else if (state.deck_count === 0) {
      // Check if all players' hands are empty
      const allHandsEmpty = state.players.every(player => player.hand.length === 0);
      if (allHandsEmpty) {
        setShowTieOverlay(true);
      }
    }
  };

  const handleWebSocketMessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'just_say_no_response':
          // Clear any existing Just Say No related UI
          setShowJustSayNoChoiceWaitingOverlay({
            isVisible: false,
            playerName: ""
          });
          setShowJustSayNoModal({
            isVisible: false,
            playingPlayer: "",
            againstPlayer: "",
            playingPlayerName: "",
            againstPlayerName: "",
            againstCard: null,
            card: null,
            data: null
          });
          if (data.play_just_say_no) {
            // Show the Just Say No Played overlay
            setShowJustSayNoPlayedOverlay({
              isVisible: true,
              playingPlayerName: data.playing_player_name,
              againstPlayerName: data.against_player_name,
              actionCard: data.against_card,
              justSayNoCard: data.card
            });

            // Hide the overlay after 3 seconds
            setTimeout(() => {
              setShowJustSayNoPlayedOverlay(prev => ({
                ...prev,
                isVisible: false
              }));
            }, 3000);
          }
          break;

        case 'just_say_no_choice':
          // First clear any existing overlays
          setShowJustSayNoPlayedOverlay(prev => ({
            ...prev,
            isVisible: false
          }));
          
          if (data.playing_player === user.unique_id) {
            setShowJustSayNoModal({
              isVisible: true,
              playingPlayer: data.playing_player,
              againstPlayer: data.against_player,
              playingPlayerName: data.playing_player_name,
              againstPlayerName: data.against_player_name,
              againstCard: data.against_card,
              againstRentCard: data.against_rent_card,
              card: data.card,
              data: data.data
            });
            // Clear the waiting overlay when showing modal
            setShowJustSayNoChoiceWaitingOverlay({
              isVisible: false,
              playerName: ""
            });
          } else {
            setShowJustSayNoChoiceWaitingOverlay({
              isVisible: true,
              playerName: data.playing_player_name
            });
            // Clear the modal when showing waiting overlay
            setShowJustSayNoModal({
              isVisible: false,
              playingPlayer: "",
              againstPlayer: "",
              playingPlayerName: "",
              againstPlayerName: "",
              againstCard: null,
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
          setPropertyStealAnimation({
            property: data.property,
            stealerId: data.player_id,
            targetId: data.target_id,
            stealerName: data.player_name,
            targetName: data.target_name
          });
          break;

        case 'property_swap':
          setPropertySwapAnimation({
            property1: data.property1,
            property2: data.property2,
            player1Id: data.player1_id,
            player2Id: data.player2_id,
            player1Name: data.player1_name,
            player2Name: data.player2_name
          });
          break;

        case 'deal_breaker_overlay':
          setDealBreakerOverlay({
            isVisible: true,
            playerName: data.player_name,
            targetName: data.target_name,
            color: data.color,
            propertySet: data.property_set
          });
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
      handleHousePlacement(pendingHouseCard, playerProperties, setError, socket, user);
      setPendingHouseCard(null);
    }
  }, [pendingHouseCard]);
  useEffect(() => {
    if (pendingHotelCard) {
      handleHotelPlacement(pendingHotelCard, playerProperties, setError, socket, user);
      setPendingHotelCard(null);
    }
  }, [pendingHotelCard])
  useEffect(() => {
    if (pendingPassGoCard) {
      let playerHand = getCurrentPlayer(gameState, user.unique_id).hand;
      let actionsRemaining = gameState.actions_remaining;
      if (2 - 1 + playerHand.length - (actionsRemaining - 1) > 7) {
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
        'player': user.unique_id,
        'card': pendingPassGoCard
      }));
      setPendingPassGoCard(null);
    }
  }, [pendingPassGoCard]);
  useEffect(() => {
    if (pendingItsYourBirthdayCard) {
      const justSayNoCard = opponentHand.find(card => card.type === 'action' && card.name.toLowerCase() === 'just say no') || null;
      if (justSayNoCard) {
        socket.send(JSON.stringify({
          action: "just_say_no_choice",
          playing_player: opponentId,
          against_player: user.unique_id,
          playing_player_name: opponentName,
          against_player_name: user.username,
          card: justSayNoCard,
          against_card: pendingItsYourBirthdayCard,
          data: JSON.stringify({
            action: "it's_your_birthday",
            player: user.unique_id,
            card: pendingItsYourBirthdayCard
          })
        }))
      } else {
        // If opponent doesn't have Just Say No, proceed with the action
        setShowActionAnimation({ visible: true, action: "It's Your Birthday!" });
        setTimeout(() => {
          setShowActionAnimation({ visible: false, action: '' });
        }, 2000);
        socket.send(JSON.stringify({
          action: "it's_your_birthday",
          player: user.unique_id,
          card: pendingItsYourBirthdayCard
        }));
      }
      setPendingItsYourBirthdayCard(null);
    }
  }, [pendingItsYourBirthdayCard]);
  useEffect(() => {
    if (pendingDebtCollectorCard) {
      const justSayNoCard = opponentHand.find(card => card.type === 'action' && card.name.toLowerCase() === 'just say no') || null;
      if (justSayNoCard) {
        socket.send(JSON.stringify({
          action: "just_say_no_choice",
          playing_player: opponentId,
          against_player: user.unique_id,
          playing_player_name: opponentName,
          against_player_name: user.username,
          card: justSayNoCard,
          against_card: pendingDebtCollectorCard,
          data: JSON.stringify({
            action: "debt_collector",
            player: user.unique_id,
            card: pendingDebtCollectorCard
          })
        }))
      }
      else {
        setShowActionAnimation({ visible: true, action: "Debt Collector" });
        setTimeout(() => {
          setShowActionAnimation({ visible: false, action: '' });
        }, 2000);
        socket.send(JSON.stringify({
          action: "debt_collector",
          player: user.unique_id,
          card: pendingDebtCollectorCard
        }))
      }
      setPendingDebtCollectorCard(null);
    }
  }, [pendingDebtCollectorCard]);
  useEffect(() => {
    if (pendingRentCard) {
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

      const handleRentColorSelect = (color, rentAmount) => {
        setRentAmount(rentAmount);

        // Check for double rent card
        const hasDoubleRentCard = playerHand.some(card => 
          card.type === 'action' && card.name.toLowerCase() === 'double the rent'
        );

        if (hasDoubleRentCard && actionsRemaining > 1) {
          setDoubleRentAmount(rentAmount * 2);
          setShowDoubleRentOverlay({
            isVisible: true,
            doubleRentAmount: rentAmount * 2,
            opponentHand: opponentHand
          });
        } else {
          const justSayNoCard = opponentHand.find(card => card.type === 'action' && card.name.toLowerCase() === 'just say no') || null;
          if (justSayNoCard) {
            socket.send(JSON.stringify({
              action: "just_say_no_choice",
              playing_player: opponentId,
              against_player: user.unique_id,
              playing_player_name: opponentName,
              against_player_name: user.username,
              card: justSayNoCard,
              against_card: pendingRentCard,
              data: JSON.stringify({
                'action': 'rent',
                'player': user.unique_id,
                'card': pendingRentCard,
                'rentColor': color,
                'rentAmount': rentAmount
              })
            }))
          } else {
            setShowActionAnimation({ visible: true, action: "Rent Request" });
            setTimeout(() => {
              setShowActionAnimation(prev => ({ ...prev, visible: false }));
            }, 2000);
            socket.send(JSON.stringify({
              'action': 'rent',
              'player': user.unique_id,
              'card': pendingRentCard,
              'rentColor': color,
              'rentAmount': rentAmount
            }));
          }
          setPendingRentCard(null);
        }
      };

      handleRentColorSelection(pendingRentCard, playerProperties, playerHand, actionsRemaining, socket, user, setRentAmount, setDoubleRentAmount, setShowActionAnimation, setPendingRentCard, setShowDoubleRentOverlay, handleRentColorSelect);
    }
  }, [pendingRentCard]);
  useEffect(() => {
    if (pendingSlyDealCard) {
      // Check if opponents have any properties at all
      const opponentPlayers = getOpponentPlayers(gameState, user.unique_id);
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
        gameState: gameState,
        card: pendingSlyDealCard,
        opponentId: opponentId
      });
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

      setForcedDealModalData({
        isVisible: true,
        gameState: gameState,
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
      const hasCompleteSets = Object.entries(opponentProperties).some(([color, cards]) => isCompleteSet(color, cards));    
      
      if (!hasCompleteSets) {
        setError("Your opponent doesn't have any complete sets!");
        setPendingDealBreakerCard(null);
        return;
      }

      setDealBreakerModalData({
        isVisible: true,
        gameState: gameState,
        card: pendingDealBreakerCard,
        opponentId: opponentId
      });
    }
  }, [pendingDealBreakerCard]);

  // Handle sly deal property selection
  const handleSlyDealPropertySelectWrapper = (modalData, selectedProperty) => {
    const opponent = modalData.gameState.players.find(p => p.id === modalData.opponentId);
    const card = modalData.card;
    const justSayNoCard = opponent.hand.find(card => card.type === 'action' && card.name.toLowerCase() === 'just say no') || null;
    if (justSayNoCard) {
      socket.send(JSON.stringify({
        action: "just_say_no_choice",
        playing_player: opponent.id,
        against_player: user.unique_id,
        playing_player_name: opponent.id,
        against_player_name: user.username,
        card: justSayNoCard,
        against_card: card,
        data: JSON.stringify({
          action: 'sly_deal',
          player: user.unique_id,
          card: pendingSlyDealCard,
          target_property: selectedProperty
        })
      }))
    }
    else {
      socket.send(JSON.stringify({
        action: 'sly_deal',
        player: user.unique_id,
        card: pendingSlyDealCard,
        target_property: selectedProperty
      }));
    }
    setSlyDealModalData(prev => ({ ...prev, isVisible: false }));
    setPendingSlyDealCard(null);
  };

  // Handle forced deal property selection
  const handleForcedDealSelectWrapper = (modalData, opponentProperty, userProperty) => {
    const opponent = modalData.gameState.players.find(p => p.id === modalData.opponentId);
    const card = modalData.card;
    const justSayNoCard = opponent.hand.find(card => card.type === 'action' && card.name.toLowerCase() === 'just say no') || null;
    if (justSayNoCard) {
      socket.send(JSON.stringify({
        action: "just_say_no_choice",
        playing_player: opponent.id,
        against_player: user.unique_id,
        playing_player_name: opponent.name,
        against_player_name: user.username,
        card: justSayNoCard,
        against_card: card,
        data: JSON.stringify({
          action: 'forced_deal',
          player: user.unique_id,
          card: pendingForcedDealCard,
          target_property: opponentProperty,
          user_property: userProperty
        })
      }))
    } else {
      socket.send(JSON.stringify({
        action: 'forced_deal',
        player: user.unique_id,
        card: pendingForcedDealCard,
        target_property: opponentProperty,
        user_property: userProperty
      }))
    }
    setForcedDealModalData(prev => ({ ...prev, isVisible: false }));
    setPendingForcedDealCard(null);
  };

  // Handle deal breaker set selection
  const handleDealBreakerSetSelectWrapper = (modalData, selectedSet) => {
    const opponent = modalData.gameState.players.find(p => p.id === modalData.opponentId);
    const card = modalData.card;
    const justSayNoCard = opponent.hand.find(card => card.type === 'action' && card.name.toLowerCase() === 'just say no') || null;
    if (justSayNoCard) {
      socket.send(JSON.stringify({
        action: "just_say_no_choice",
        playing_player: opponent.id,
        against_player: user.unique_id,
        playing_player_name: opponent.name,
        against_player_name: user.username,
        card: justSayNoCard,
        against_card: card,
        data: JSON.stringify({
          action: 'deal_breaker',
          player: user.unique_id,
          card: card,
          target_set: selectedSet.cards,
          target_color: selectedSet.color
        })
      }))
    }
    else {
      socket.send(JSON.stringify({
        action: 'deal_breaker',
        player: user.unique_id,
        card: card,
        target_set: selectedSet.cards,
        target_color: selectedSet.color
      }));
    }
    setDealBreakerModalData(prev => ({ ...prev, isVisible: false }));
    setPendingDealBreakerCard(null);
  };

  // Handle double rent response
  const handleDoubleRentResponseWrapper = (useDoubleRent) => {
    setShowDoubleRentOverlay(prev => ({ ...prev, isVisible: false }));
    
    if (useDoubleRent) {
      const doubleTheRentCard = playerHand.find(card => 
        card.type === 'action' && card.name.toLowerCase() === 'double the rent'
      );
      const justSayNoCard = showDoubleRentOverlay.opponentHand.find(card => card.type === 'action' && card.name.toLowerCase() === 'just say no') || null;
      if (justSayNoCard) {
        socket.send(JSON.stringify({
          action: "just_say_no_choice",
          playing_player: opponentId,
          against_player: user.unique_id,
          playing_player_name: opponentName,
          against_player_name: user.username,
          card: justSayNoCard,
          against_card: doubleTheRentCard,
          against_rent_card: pendingRentCard,
          data: JSON.stringify({
            'action': 'double_the_rent',
            'player': user.unique_id,
            'card': pendingRentCard,
            'double_the_rent_card': doubleTheRentCard,
            'rentAmount': doubleRentAmount
          })
        }))
      } else {
        socket.send(JSON.stringify({
          'action': 'double_the_rent',
          'player': user.unique_id,
          'card': pendingRentCard,
          'double_the_rent_card': doubleTheRentCard,
          'rentAmount': doubleRentAmount
        }));
      }
    } else {
      const justSayNoCard = showDoubleRentOverlay.opponentHand.find(card => card.type === 'action' && card.name.toLowerCase() === 'just say no') || null;
      if (justSayNoCard) {
        socket.send(JSON.stringify({
          action: "just_say_no_choice",
          playing_player: opponentId,
          against_player: user.unique_id,
          playing_player_name: opponentName,
          against_player_name: user.username,
          card: justSayNoCard,
          against_card: pendingRentCard,
          data: JSON.stringify({
            'action': 'rent',
            'player': user.unique_id,
            'card': pendingRentCard,
            'rentAmount': rentAmount
          })
        }))
      } else {
        setTimeout(() => {
          setShowActionAnimation({ visible: true, action: "Rent Request" });
          setTimeout(() => {
            setShowActionAnimation({ visible: false, action: '' });
          }, 2000);
          socket.send(JSON.stringify({
            'action': 'rent',
            'player': user.unique_id,
            'card': pendingRentCard,
            'rentAmount': rentAmount
          }));
          setPendingRentCard(null);
        }, 50);
      }
    }
    setPendingRentCard(null);
  };

  // Handle rent payment
  const handleRentPaymentWrapper = (selectedCards) => {
    // handleRentPayment(selectedCards, socket, user, rentRecipientId);
    const message = {
      action: 'rent_payment',
      player: user.unique_id,
      recipient_id: rentRecipientId,
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
    if (playerHand.length > 7) {
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
        

        {/* Game Modals */}
        <GameModals
          rentModalOpen={rentModalOpen}
          setRentModalOpen={setRentModalOpen}
          rentModalData={{
            amountDue: rentAmount,
            recipientName: rentRecipientId === user.unique_id ? 'You' : opponentName,
            rentType: rentType,
            playerBank: playerBank,
            playerProperties: playerProperties,
          }}
          // rentModalOpen={rentModalData.isVisible}
          // setRentModalData={setRentModalData}
          // rentModalData={{
          //   gameState: rentModalData.gameState,
          //   card: rentModalData.card,
          //   opponentId: rentModalData.opponentId,
          //   userId: rentModalData.userId,
          //   amountDue: rentModalData.amountDue,
          //   rentType: rentModalData.rentType,
          // }}
          handleRentPayment={handleRentPaymentWrapper}
          
          slyDealModalOpen={slyDealModalData.isVisible}
          setSlyDealModalData={setSlyDealModalData}
          slyDealModalData={{
            gameState: slyDealModalData.gameState,
            opponentId: slyDealModalData.opponentId,
            card: slyDealModalData.card,
          }}
          handleSlyDealPropertySelect={handleSlyDealPropertySelectWrapper}
          
          forcedDealModalOpen={forcedDealModalData.isVisible}
          setForcedDealModalData={setForcedDealModalData}
          forcedDealModalData={{
            gameState: forcedDealModalData.gameState,
            opponentId: forcedDealModalData.opponentId,
            userId: user.unique_id,
            card: forcedDealModalData.card,
          }}
          handleForcedDealPropertySelect={handleForcedDealSelectWrapper}
          
          dealBreakerModalOpen={dealBreakerModalData.isVisible}
          setDealBreakerModalData={setDealBreakerModalData}
          dealBreakerModalData={{
            gameState: dealBreakerModalData.gameState,
            opponentId: dealBreakerModalData.opponentId,
            card: dealBreakerModalData.card,
          }}
          handleDealBreakerPropertySetSelect={handleDealBreakerSetSelectWrapper}
          
          justSayNoModalOpen={showJustSayNoModal.isVisible}
          setJustSayNoModalOpen={setShowJustSayNoModal}
          justSayNoModalData={{
            playingPlayer: showJustSayNoModal.playingPlayer,
            againstPlayer: showJustSayNoModal.againstPlayer,
            playingPlayerName: showJustSayNoModal.playingPlayerName,
            againstPlayerName: showJustSayNoModal.againstPlayerName,
            againstCard: showJustSayNoModal.againstCard,
            againstRentCard: showJustSayNoModal.againstRentCard,
            card: showJustSayNoModal.card,
            data: showJustSayNoModal.data
          }}
          handleJustSayNoResponse={() => {}}
        />
        

        {/* Overlays */}
        <RentCollectionOverlay isVisible={showRentCollectionOverlay} />
        <PaymentSuccessfulOverlay
          isVisible={showPaymentSuccessfulOverlay.isVisible}
          playerName={showPaymentSuccessfulOverlay.playerName}
          targetName={showPaymentSuccessfulOverlay.targetName}
          selectedCards={showPaymentSuccessfulOverlay.selectedCards}
        />
        {propertySwapAnimation && (<PropertySwapOverlay
          animation={propertySwapAnimation}
          onComplete={() => setPropertySwapAnimation(null)}
          user={user}
        />)}
        {propertyStealAnimation && (<PropertyStealOverlay
          animation={propertyStealAnimation}
          onComplete={() => setPropertyStealAnimation(null)}
          user={user}
        />)}
        <DealBreakerOverlay
          {...dealBreakerOverlay}
          onClose={() => setDealBreakerOverlay(prev => ({ ...prev, isVisible: false }))}
        />
        <JustSayNoChoiceWaitingOverlay isVisible={showJustSayNoChoiceWaitingOverlay.isVisible} playerName={showJustSayNoChoiceWaitingOverlay.playerName} />
        <JustSayNoPlayedOverlay
          isVisible={showJustSayNoPlayedOverlay.isVisible}
          playingPlayerName={showJustSayNoPlayedOverlay.playingPlayerName}
          againstPlayerName={showJustSayNoPlayedOverlay.againstPlayerName}
          actionCard={showJustSayNoPlayedOverlay.actionCard}
          justSayNoCard={showJustSayNoPlayedOverlay.justSayNoCard}
        />
        <DoubleRentOverlay
          isVisible={showDoubleRentOverlay.isVisible}
          modalData={showDoubleRentOverlay}
          onResponse={handleDoubleRentResponseWrapper}
        />
        <WinnerOverlay isVisible={showWinnerOverlay} winner={winner} />
        <TieOverlay isVisible={showTieOverlay} />
        
        {/* Game Layout */}
        <div className="flex flex-col justify-between h-[calc(100vh-4rem)] py-32 px-8 overflow-hidden bg-gray-200">
          {/* Turn Display */}
          <TurnDisplay 
            currentTurnPlayerId={currentTurnPlayerId}
            currentTurnPlayerName={currentTurnPlayerName}
            actionsRemaining={actionsRemaining}
            userId={user.unique_id}
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
