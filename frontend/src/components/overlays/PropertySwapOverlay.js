import React, { useEffect, useRef } from 'react';
import { getPropertyWithDefaults } from '../../utils/gameUtils';
import CardMovementAnimation from './CardMovementAnimation';

const PropertySwapOverlay = ({ isVisible, onClose, overlayData }) => {
  const property1 = overlayData?.property1;
  const property2 = overlayData?.property2;
  const player1Id = overlayData?.player1Id;
  const player2Id = overlayData?.player2Id;
  
  // Process property data
  const property1WithDefaults = property1 ? getPropertyWithDefaults(property1) : null;
  const property2WithDefaults = property2 ? getPropertyWithDefaults(property2) : null;
  
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
  
  // Forced cleanup function
  const forceCleanup = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    onClose();
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
  
  // Only render if overlay is visible and we have animation data
  if (!isVisible || (!animation1Data && !animation2Data)) {
    return null;
  }
  
  return (
    <>
      {/* Both animations run concurrently */}
      {animation1Data && (
        <CardMovementAnimation
          key={`property1-forced-deal-${property1?.id}`}
          isVisible={true}
          onClose={() => {}}
          animationData={animation1Data}
          animationConfig={animationConfig}
        />
      )}
      
      {animation2Data && (
        <CardMovementAnimation
          key={`property2-forced-deal-${property2?.id}`}
          isVisible={true}
          onClose={() => {}}
          animationData={animation2Data}
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

export default PropertySwapOverlay;
