import React, { useState, useEffect, useRef } from 'react';
import PropertyCard from '../cards/PropertyCard';
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
  const animationTimeoutRef = useRef(null);
  
  // Animation configurations - optimized for performance
  const animationConfig = {
    stiffness: 60,        // Increased for faster animation
    damping: 14,          // Increased for less oscillation
    moveDuration: 1.0,    // Reduced duration
    fadeInDuration: 0.2,  // Faster fade in
    fadeOutDuration: 0.2, // Faster fade out
    scale: 0.8
  };
  
  // Handle animation completion
  const handleAnimationComplete = () => {
    setAnimationsCompleted(prev => prev + 1);
  };
  
  // Forced cleanup function
  const forceCleanup = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
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
      setAnimationsCompleted(0);
      // Count how many animations we'll have
      totalAnimations.current = (animation1Data ? 1 : 0) + (animation2Data ? 1 : 0);
      
      // Safety timeout - force close after a maximum time
      animationTimeoutRef.current = setTimeout(() => {
        onClose();
      }, 3000); // Force close after 3 seconds regardless of animation state
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [isVisible, animation1Data, animation2Data, onClose]);
  
  // Close overlay when all animations are complete
  useEffect(() => {
    if (animationsCompleted >= totalAnimations.current && totalAnimations.current > 0) {
      onClose();
    }
  }, [animationsCompleted, onClose]);
  
  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isVisible) {
        // If tab becomes hidden during animation, force cleanup
        forceCleanup();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isVisible]);
  
  // Only render if overlay is visible and we have animation data
  if (!isVisible || (!animation1Data && !animation2Data)) {
    return null;
  }
  
  return (
    <>
      {/* Both animations run concurrently */}
      {animation1Data && (
        <CardMovementAnimation
          key={`property1-${property1?.id}`}
          isVisible={true}
          onClose={handleAnimationComplete}
          animationData={animation1Data}
          animationConfig={animationConfig}
          renderCard={renderCard}
        />
      )}
      
      {animation2Data && (
        <CardMovementAnimation
          key={`property2-${property2?.id}`}
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
