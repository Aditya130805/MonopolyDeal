export const handleSlyDealPropertySelect = (selectedProperty, socket, user, pendingSlyDealCard, setPendingSlyDealCard) => {
  console.log("Selected property for Sly Deal:", selectedProperty);
  socket.send(JSON.stringify({
    action: 'sly_deal',
    player: user.unique_id,
    card: pendingSlyDealCard,
    target_property: selectedProperty.id
  }));
  setPendingSlyDealCard(null);
};

export const handleForcedDealSelect = (
  opponentProperty,
  userProperty,
  socket,
  user,
  pendingForcedDealCard,
  setForcedDealModalOpen,
  setPendingForcedDealCard
) => {
  const message = {
    action: 'forced_deal',
    player: user.unique_id,
    card: pendingForcedDealCard,
    target_property: opponentProperty.id,
    user_property: userProperty.id
  };
  socket.send(JSON.stringify(message));
  setForcedDealModalOpen(false);
  setPendingForcedDealCard(null);
};

export const handleDealBreakerSetSelect = (
  selectedSet,
  socket,
  user,
  pendingDealBreakerCard,
  setDealBreakerModalOpen,
  setPendingDealBreakerCard
) => {
  console.log("Selected Set:", selectedSet);
  const message = {
    action: 'deal_breaker',
    player: user.unique_id,
    card: pendingDealBreakerCard,
    target_set: selectedSet.cards,
    target_color: selectedSet.color
  };
  socket.send(JSON.stringify(message));
  setDealBreakerModalOpen(false);
  setPendingDealBreakerCard(null);
};
