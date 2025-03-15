import React, { useState, useEffect, useRef } from 'react';
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
  
  // Track completed animations
  const [animationsCompleted, setAnimationsCompleted] = useState(0);
  const totalAnimations = useRef(0);
  
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
  const handleAnimationComplete = () => {
    setAnimationsCompleted(prev => prev + 1);
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
      setAnimationsCompleted(0);
      // Count how many animations we'll have
      totalAnimations.current = (animation1Data ? 1 : 0) + (animation2Data ? 1 : 0);
    }
  }, [isVisible, animation1Data, animation2Data]);
  
  // Close overlay when all animations are complete
  useEffect(() => {
    if (animationsCompleted >= totalAnimations.current && totalAnimations.current > 0) {
      onClose();
    }
  }, [animationsCompleted, onClose]);
  
  return (
    <>
      {/* Both animations run concurrently */}
      {isVisible && animation1Data && (
        <CardMovementAnimation
          isVisible={true}
          onClose={handleAnimationComplete}
          animationData={animation1Data}
          animationConfig={animationConfig}
          renderCard={renderCard}
        />
      )}
      
      {isVisible && animation2Data && (
        <CardMovementAnimation
          isVisible={true}
          onClose={handleAnimationComplete}
          animationData={animation2Data}
          animationConfig={animationConfig}
          renderCard={renderCard}
        />
      )}
    </>
  );
};

export default PropertySwapOverlay;
