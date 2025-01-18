import { handleWildPropertySelection } from '../../utils/wildPropertyHandler';

export const handleCardDropBank = (
  card,
  isUserTurnRef,
  socket,
  user,
  setError
) => {
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
    }));
  };
  // Delay the actual card removal to allow for animation
  setTimeout(sendToBank, 300);
};

export const handleCardDropProperty = (
  card,
  isUserTurnRef,
  socket,
  user,
  setPendingHouseCard,
  setPendingHotelCard,
  setError
) => {
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

export const handleCardDropAction = (
  card,
  isUserTurnRef,
  socket,
  user,
  setPendingPassGoCard,
  setPendingItsYourBirthdayCard,
  setPendingDebtCollectorCard,
  setPendingRentCard,
  setPendingSlyDealCard,
  setPendingForcedDealCard,
  setPendingDealBreakerCard,
  setError
) => {
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
  } else if (card.name.toLowerCase() === 'double the rent') {
    setError('Double the rent action card must be preceded by a Rent action card');
    return;
  }

  const sendToAction = () => {
    if (card.name.toLowerCase() === 'pass go') {
      setPendingPassGoCard(card);
    } else if (card.name.toLowerCase() === "it's your birthday") {
      setPendingItsYourBirthdayCard(card);
    } else if (card.name.toLowerCase() === 'debt collector') {
      setPendingDebtCollectorCard(card);
    } else if (card.name.toLowerCase() === 'rent' || card.name.toLowerCase() === 'multicolor rent') {
      setPendingRentCard(card);
    } else if (card.name.toLowerCase() === 'sly deal') {
      setPendingSlyDealCard(card);
    } else if (card.name.toLowerCase() === 'forced deal') {
      setPendingForcedDealCard(card);
    } else if (card.name.toLowerCase() === 'deal breaker') {
      setPendingDealBreakerCard(card);
    }
  };
  // Delay the actual card removal to allow for animation
  setTimeout(sendToAction, 300);
};
