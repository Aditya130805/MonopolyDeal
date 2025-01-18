export const handleRentPayment = (selectedCards, socket, user, rentRecipientId) => {
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

export const handleDoubleRentResponse = (
  useDoubleRent,
  socket,
  user,
  pendingRentCard,
  playerHand,
  doubleRentAmount,
  rentAmount,
  setShowDoubleRentOverlay,
  setPendingRentCard,
  setShowActionAnimation
) => {
  setShowDoubleRentOverlay(false);
  setPendingRentCard(null);
  
  if (useDoubleRent) {
    const doubleTheRentCard = playerHand.find(card => 
      card.type === 'action' && card.name.toLowerCase() === 'double the rent'
    );
    
    socket.send(JSON.stringify({
      'action': 'double_the_rent',
      'player': user.unique_id,
      'card': pendingRentCard,
      'double_the_rent_card': doubleTheRentCard,
      'rentAmount': doubleRentAmount
    }));
  } else {
    setTimeout(() => {
      setShowActionAnimation({ visible: true, action: "Rent Request" });
      socket.send(JSON.stringify({
        'action': 'rent',
        'player': user.unique_id,
        'card': pendingRentCard,
        'rentAmount': rentAmount
      }));
      setPendingRentCard(null);
    }, 50);
  }
};
