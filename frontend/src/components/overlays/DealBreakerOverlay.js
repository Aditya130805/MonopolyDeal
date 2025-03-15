import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropertyCard from '../cards/PropertyCard';
import ActionCard from '../cards/ActionCard';
import { useGameState } from '../../contexts/GameStateContext';
import CardMovementAnimation from './CardMovementAnimation';

const DealBreakerOverlay = ({ isVisible, onClose, overlayData }) => {
  const { gameState } = useGameState();
  
  const stealerId = overlayData?.stealerId;
  const targetId = overlayData?.targetId;
  const color = overlayData?.color;
  const propertySet = overlayData?.propertySet || [];
  
  // Calculate source and target element IDs for the property set
  const getSourceElementId = () => `${color}-property-${targetId || 'unknown'}`;
  const getTargetElementId = () => `${color}-property-${stealerId || 'unknown'}`;
  
  // Reset animation when overlay becomes visible
  useEffect(() => {
    if (!isVisible) return;
    
    // Auto-close after animation completes (with buffer for animation duration)
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Allow enough time for the full animation sequence
    
    return () => clearTimeout(timer);
  }, [isVisible, onClose]);

  // Prepare animation data with all cards
  const prepareAnimationData = () => {
    if (!propertySet || propertySet.length === 0) {
      return null;
    }
    
    return {
      cards: propertySet,
      sourceElementId: getSourceElementId(),
      targetElementId: getTargetElementId()
    };
  };
  
  // Custom render function for the cards
  const renderCard = (card, index, totalCards) => {
    return card.type === 'property' ? (
      <PropertyCard {...card} scale={0.8} />
    ) : (card.type === 'action') ? (
      <ActionCard {...card} scale={0.8} />
    ) : null;
  };
  
  // Animation configuration
  const animationConfig = {
    stiffness: 40,
    damping: 12,
    moveDuration: 2.0,
    fadeInDuration: 0.3,
    fadeOutDuration: 0.3,
    scale: 0.8,
    cardOffset: -100 // Negative value creates overlap between cards
  };
  
  return (
    <>
      {isVisible && propertySet && propertySet.length > 0 && (
        <CardMovementAnimation
          key="deal-breaker-animation"
          isVisible={isVisible}
          onClose={onClose}
          animationData={prepareAnimationData()}
          animationConfig={animationConfig}
          renderCard={renderCard}
        />
      )}
    </>
  );
};

export default DealBreakerOverlay;
