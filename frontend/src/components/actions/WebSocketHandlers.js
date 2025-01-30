export const handleWebSocketMessage = (
  event,
  user,
  roomId,
  cardNotificationTimeoutRef,
  setCardNotifications,
  setShowActionAnimation,
  setRentAmount,
  setRentRecipientId,
  setRentModalOpen,
  setShowRentCollectionOverlay,
  setShowPaymentSuccessfulOverlay,
  setRentType,
  setPropertyStealAnimation,
  setPropertySwapAnimation,
  setDealBreakerOverlay,
  setPlayerHand,
  setPlayerBank,
  setPlayerProperties,
  setOpponentHand,
  setOpponentBank,
  setOpponentProperties,
  setNumCardsInDrawPile,
  setLastAction,
  setCurrentTurnPlayerId,
  setCurrentTurnPlayerName,
  setActionsRemaining,
  setOpponentId,
  setOpponentName,
  rentCollectionTimeoutRef,
  setWinner,
  setShowWinnerOverlay,
  setShowTieOverlay,
  setShowJustSayNoModal,
  setShowJustSayNoChoiceWaitingOverlay,
  setShowJustSayNoPlayedOverlay
) => {
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
        handleCardPlayed(data, user, cardNotificationTimeoutRef, setCardNotifications, setShowActionAnimation);
        break;

      case 'rent_request':
        handleRentRequest(data, user, setRentAmount, setRentRecipientId, setRentModalOpen, setShowActionAnimation, setShowRentCollectionOverlay, setRentType, rentCollectionTimeoutRef);
        break;

      case 'rent_paid':
        handleRentPaid(data, user, setShowRentCollectionOverlay, setRentModalOpen, setRentAmount, setRentRecipientId, setShowPaymentSuccessfulOverlay, setRentType, rentCollectionTimeoutRef);
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
        handleGameUpdate(data, user, setPlayerHand, setPlayerBank, setPlayerProperties, setOpponentHand, setOpponentBank, setOpponentProperties, setNumCardsInDrawPile, setLastAction, setCurrentTurnPlayerId, setCurrentTurnPlayerName, setActionsRemaining, setOpponentId, setOpponentName, setWinner, setShowWinnerOverlay, setShowTieOverlay);
        break;
    }
  } catch (error) {
    console.error("Error parsing WebSocket message:", error);
  }
};

const handleCardPlayed = (
  data,
  user,
  cardNotificationTimeoutRef,
  setCardNotifications,
  setShowActionAnimation
) => {
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

const handleRentRequest = (
  data,
  user,
  setRentAmount,
  setRentRecipientId,
  setRentModalOpen,
  setShowActionAnimation,
  setShowRentCollectionOverlay,
  setRentType,
  rentCollectionTimeoutRef
) => {
  setRentAmount(data.amount);
  setRentRecipientId(data.recipient_id);
  setRentType(data.rent_type);
  
  if (data.recipient_id !== user.unique_id) {
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

const handleRentPaid = (
  data,
  user,
  setShowRentCollectionOverlay,
  setRentModalOpen,
  setRentAmount,
  setRentRecipientId,
  setShowPaymentSuccessfulOverlay,
  setRentType,
  rentCollectionTimeoutRef
) => {
  // Clear any pending timeout for rent collection overlay
  if (rentCollectionTimeoutRef.current) {
    clearTimeout(rentCollectionTimeoutRef.current);
    rentCollectionTimeoutRef.current = null;
  }
  
  // Hide overlay for the player who requested rent
  setShowRentCollectionOverlay(false);
  // Clear states since rent collection is complete
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

const handleGameUpdate = (
  data,
  user,
  setPlayerHand,
  setPlayerBank,
  setPlayerProperties,
  setOpponentHand,
  setOpponentBank,
  setOpponentProperties,
  setNumCardsInDrawPile,
  setLastAction,
  setCurrentTurnPlayerId,
  setCurrentTurnPlayerName,
  setActionsRemaining,
  setOpponentId,
  setOpponentName,
  setWinner,
  setShowWinnerOverlay,
  setShowTieOverlay
) => {
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
  const opponent = opponents[0]; // Since it's a 2-player game
  if (opponent) {
    setOpponentId(opponent.id);
    setOpponentName(opponent.name);
    setOpponentHand(opponent.hand);
    setOpponentBank(opponent.bank);
    setOpponentProperties(opponent.properties);
  }
  
  setNumCardsInDrawPile(gameState.deck_count);
  setLastAction(gameState.discard_pile ? gameState.discard_pile[gameState.discard_pile.length - 1] : null);
  
  // Convert current turn ID to username  
  setCurrentTurnPlayerId(gameState.current_turn);
  const currentTurnPlayer = gameState.players.find(p => p.id === gameState.current_turn);
  setCurrentTurnPlayerName(currentTurnPlayer ? currentTurnPlayer.name : '');
  setActionsRemaining(gameState.actions_remaining || 0);

  // Handle winner or tie
  if (gameState.winner) {
    setWinner(gameState.winner);
    setShowWinnerOverlay(true);
  } else if (gameState.deck_count === 0) {
    // Check if all players' hands are empty
    const allHandsEmpty = gameState.players.every(player => player.hand.length === 0);
    if (allHandsEmpty) {
      setShowTieOverlay(true);
    }
  }
};
