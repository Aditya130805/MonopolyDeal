import React, { useState, useEffect } from 'react';
import PropertyCard from '../cards/PropertyCard';
import { useAuth } from '../../contexts/AuthContext';
import { useGameState } from '../../contexts/GameStateContext';
import { getPropertyWithDefaults } from '../../utils/gameUtils';
import CardMovementAnimation from './CardMovementAnimation';

const PropertySwapOverlay = ({ isVisible, onClose, overlayData }) => {
  const { gameState } = useGameState();
  
  const property1 = overlayData?.property1;
  const property2 = overlayData?.property2;
  const player1Id = overlayData?.player1Id;
  const player2Id = overlayData?.player2Id;
  
  // Process property data
  const property1WithDefaults = property1 ? getPropertyWithDefaults(property1) : null;
  const property2WithDefaults = property2 ? getPropertyWithDefaults(property2) : null;
  
  // Animation sequence state
  const [currentAnimation, setCurrentAnimation] = useState(0);
  
  // Animation configurations
  const animationConfig = {
    stiffness: 40,
    damping: 12,
    moveDuration: 1.5,
    fadeInDuration: 0.3,
    fadeOutDuration: 0.4,
    scale: 0.8
  };
  
  // Handle animation completion
  const handleFirstAnimationComplete = () => {
    setCurrentAnimation(1);
  };
  
  const handleSecondAnimationComplete = () => {
    onClose();
  };
  
  // Custom render function for property cards
  const renderCard = (card) => {
    return <PropertyCard {...card} scale={0.8} />;
  };
  
  // Prepare animation data for property 1
  const animation1Data = property1WithDefaults ? {
    card: property1WithDefaults,
    sourceElementId: `${property1.currentColor || property1.color}-property-${player2Id || 'unknown'}`,
    targetElementId: `${property1.currentColor || property1.color}-property-${player1Id || 'unknown'}`
  } : null;
  
  // Prepare animation data for property 2
  const animation2Data = property2WithDefaults ? {
    card: property2WithDefaults,
    sourceElementId: `${property2.currentColor || property2.color}-property-${player1Id || 'unknown'}`,
    targetElementId: `${property2.currentColor || property2.color}-property-${player2Id || 'unknown'}`
  } : null;
  
  // Reset animation state when overlay visibility changes
  useEffect(() => {
    if (isVisible) {
      setCurrentAnimation(0);
    }
  }, [isVisible]);
  
  return (
    <>
      {/* First animation - Property 1 moving from player 1 to player 2 */}
      {isVisible && currentAnimation === 0 && animation1Data && (
        <CardMovementAnimation
          isVisible={true}
          onClose={handleFirstAnimationComplete}
          animationData={animation1Data}
          animationConfig={animationConfig}
          renderCard={renderCard}
        />
      )}
      
      {/* Second animation - Property 2 moving from player 2 to player 1 */}
      {isVisible && currentAnimation === 1 && animation2Data && (
        <CardMovementAnimation
          isVisible={true}
          onClose={handleSecondAnimationComplete}
          animationData={animation2Data}
          animationConfig={animationConfig}
          renderCard={renderCard}
        />
      )}
    </>
  );
};

export default PropertySwapOverlay;
