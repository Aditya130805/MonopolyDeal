import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGameState } from '../../contexts/GameStateContext';
import CardMovementAnimation from './CardMovementAnimation';

const PropertyStealOverlay = ({ isVisible, onClose, overlayData }) => {
  const property = overlayData?.property;  // The actual property object
  const stealerId = overlayData?.stealerId;
  const targetId = overlayData?.targetId;
  
  // Prepare animation data for the CardMovementAnimation component
  const animationData = property ? {
    card: property,
    sourceElementId: `${property.currentColor || property.color}-property-${targetId || 'unknown'}`,
    targetElementId: `${property.currentColor || property.color}-property-${stealerId || 'unknown'}`
  } : null;
  
  // Animation configuration
  const animationConfig = {
    stiffness: 40,
    damping: 12,
    moveDuration: 2.8,
    fadeInDuration: 0.3,
    fadeOutDuration: 0.4,
    scale: 0.8
  };

  return (
    <CardMovementAnimation
      isVisible={isVisible}
      onClose={onClose}
      animationData={animationData}
      animationConfig={animationConfig}
    />
  );
};

export default PropertyStealOverlay;
