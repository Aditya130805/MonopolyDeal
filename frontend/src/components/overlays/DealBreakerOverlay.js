import React, { useEffect, useRef } from 'react';
import CardMovementAnimation from './CardMovementAnimation';

const DealBreakerOverlay = ({ isVisible, onClose, overlayData }) => {
  
  const stealerId = overlayData?.stealerId;
  const targetId = overlayData?.targetId;
  const color = overlayData?.color;
  const propertySet = overlayData?.propertySet || [];

  // Calculate source and target element IDs for the property set
  const getSourceElementId = () => `${color}-property-${targetId || 'unknown'}`;
  const getTargetElementId = () => `${color}-property-${stealerId || 'unknown'}`;
  
  const totalAnimations = useRef(0);
  const animationTimeoutRef = useRef(null);
  
  // Animation configurations - optimized for performance
  const animationConfig = {
    stiffness: 60,        // Increased for faster animation
    damping: 14,          // Increased for less oscillation
    moveDuration: 1.0,    // Reduced duration
    fadeInDuration: 0.2,  // Faster fade in
    fadeOutDuration: 0.2, // Faster fade out
    scale: 0.8,
    cardOffset: -100 // Negative value creates overlap between cards
  };
  
  // Forced cleanup function
  const forceCleanup = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    onClose();
  };
  
  // Prepare animation data with all cards
  const animationData = propertySet.length > 0 ? {
    cards: propertySet,
    sourceElementId: getSourceElementId(),
    targetElementId: getTargetElementId()
  } : null;
  
  // Reset animation state when overlay visibility changes
  useEffect(() => {
    if (isVisible) {
      // setAnimationsCompleted(0);
      // Count how many animations we'll have
      totalAnimations.current = (animationData ? 1 : 0);
      
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
  }, [isVisible, animationData, onClose]);
  
  // Only render if overlay is visible and we have animation data
  if (!isVisible || !animationData) {
    return null;
  }
  
  return (
    <>
      {/* Both animations run concurrently */}
      {animationData && (
        <CardMovementAnimation
          key={`property-set-deal-breaker-${propertySet[0]?.id}`}
          isVisible={true}
          onClose={() => {}}
          animationData={animationData}
          animationConfig={animationConfig}
        />
      )}
      {(() => {
        setTimeout(() => {
          onClose();
        }, 2000);
        return null; // Return null so nothing is rendered
      })()}
    </>
  );
};

export default DealBreakerOverlay;
