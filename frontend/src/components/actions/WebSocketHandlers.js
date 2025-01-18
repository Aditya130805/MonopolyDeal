export const handleWebSocketMessage = (
  event,
  user,
  roomId,
  cardNotificationTimeoutRef,
  setShowCardNotification,
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
  setOpponentName
) => {
  try {
    const data = JSON.parse(event.data);
    console.log(`(Handler 2) WebSocket message in room ${roomId}:`, data);

    switch (data.type) {
      case 'card_played':
        handleCardPlayed(data, user, cardNotificationTimeoutRef, setShowCardNotification, setShowActionAnimation);
        break;

      case 'rent_request':
        handleRentRequest(data, user, setRentAmount, setRentRecipientId, setRentModalOpen, setShowActionAnimation, setShowRentCollectionOverlay, setRentType);
        break;

      case 'rent_paid':
        handleRentPaid(setShowRentCollectionOverlay, setRentModalOpen, setRentAmount, setRentRecipientId, setShowPaymentSuccessfulOverlay, setRentType);
        break;

      case 'property_stolen':
        setPropertyStealAnimation({
          property: data.property,
          stealerId: data.player_id,
          targetId: data.target_id
        });
        break;

      case 'property_swap':
        setPropertySwapAnimation({
          property1: data.property1,
          property2: data.property2,
          player1Id: data.player1_id,
          player2Id: data.player2_id
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
        handleGameUpdate(data, user, setPlayerHand, setPlayerBank, setPlayerProperties, setOpponentHand, setOpponentBank, setOpponentProperties, setNumCardsInDrawPile, setLastAction, setCurrentTurnPlayerId, setCurrentTurnPlayerName, setActionsRemaining, setOpponentId, setOpponentName);
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
  setShowCardNotification,
  setShowActionAnimation
) => {
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
  if (data.player_id === user.unique_id && 
      data.card.type === 'action' && 
      data.card.name.toLowerCase() !== 'house' && 
      data.card.name.toLowerCase() !== 'hotel' && 
      data.action_type !== 'to_bank' && 
      data.action_type !== 'to_properties') {
    setShowActionAnimation({ visible: true, action: data.action });
    // Hide animation after 2 seconds
    setTimeout(() => {
      setShowActionAnimation(prev => ({ ...prev, visible: false }));
    }, 2000);
  }
};

const handleRentRequest = (
  data,
  user,
  setRentAmount,
  setRentRecipientId,
  setRentModalOpen,
  setShowActionAnimation,
  setShowRentCollectionOverlay,
  setRentType
) => {
  console.log("RENT REQUEST DATA:", data);
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
    setTimeout(() => {
      // Hide action animation (will trigger fade out)
      setShowActionAnimation(prev => ({ ...prev, visible: false }));
      // Show rent collection overlay
      setShowRentCollectionOverlay(true);
    }, 2000);
  }
};

const handleRentPaid = (
  setShowRentCollectionOverlay,
  setRentModalOpen,
  setRentAmount,
  setRentRecipientId,
  setShowPaymentSuccessfulOverlay,
  setRentType
) => {
  // Hide overlay for the player who requested rent
  setShowRentCollectionOverlay(false);
  // Clear states since rent collection is complete
  setRentModalOpen(false);
  setRentAmount(0);
  setRentRecipientId(null);
  setRentType(null);
  setShowPaymentSuccessfulOverlay(true);
  // Hide overlay after 2 seconds
  setTimeout(() => {
    setShowPaymentSuccessfulOverlay(false);
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
  setOpponentName
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
};
