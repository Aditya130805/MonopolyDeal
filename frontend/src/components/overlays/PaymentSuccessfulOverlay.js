import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '../../contexts/GameStateContext';
import CardMovementAnimation from './CardMovementAnimation';

const PaymentSuccessfulOverlay = ({ isVisible, onClose, overlayData }) => {
  const { gameState } = useGameState();

  // Use refs to avoid re-renders and infinite update loops
  const playerIdRef = useRef(null);
  const targetIdRef = useRef(null);
  const selectedCardsRef = useRef([]);
  const cardGroupsRef = useRef([]);
  
  // Update refs when overlay data changes, but don't cause re-renders
  if (isVisible && overlayData) {
    playerIdRef.current = overlayData.playerId;
    targetIdRef.current = overlayData.targetId;
    selectedCardsRef.current = overlayData.selectedCards || [];
  }
  // Track completed animations
  const totalAnimations = useRef(0);
  const animationTimeoutRef = useRef(null);
  
  // Animation configuration
  const animationConfig = {
    stiffness: 60,        // Increased for faster animation
    damping: 14,          // Increased for less oscillation
    moveDuration: 1.0,    // Reduced duration
    fadeInDuration: 0.2,  // Faster fade in
    fadeOutDuration: 0.2, // Faster fade out
    scale: 0.8,
    cardOffset: -100,     // Negative offset creates overlap between cards
    finalDelay: 50        // Final delay before closing
  };
  
  // Forced cleanup function
  const forceCleanup = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    onClose();
  };

  // Determine source and target element IDs for each card
  const getElementIds = (card) => {
    const playerId = playerIdRef.current;
    const targetId = targetIdRef.current;
    
    // Determine source element ID (from paying player)
    let sourceElementId;
    if (card.type === 'property') {
      // Property cards come from property set
      sourceElementId = `${card.currentColor || card.color}-property-${playerId}`;
    } else if (card.type === 'money') {
      // Money cards come from bank with specific value
      sourceElementId = `bank-${card.value}-${playerId}`;
    } else {
      // Action cards come from bank
      sourceElementId = `bank-${card.value || 0}-${playerId}`;
    }
    
    // Determine target element ID (to receiving player)
    let targetElementId;
    if (card.type === 'property') {
      // Property cards go to property set
      targetElementId = `${card.currentColor || card.color}-property-${targetId}`;
    } else if (card.type === 'money') {
      // Money cards go to bank with specific value
      targetElementId = `bank-${card.value}-${targetId}`;
    } else {
      // Action cards go to bank
      targetElementId = `bank-${card.value || 0}-${targetId}`;
    }
    
    return { sourceElementId, targetElementId };
  };

  // Create animation data for all cards with source and target element IDs
  const cards = selectedCardsRef.current.map(card => ({
    card,
    ...getElementIds(card)
  }));
  
  // Group cards by source and target element IDs
  const groupCardsByElements = () => {
    const groups = {};
    
    selectedCardsRef.current.forEach(card => {
      const { sourceElementId, targetElementId } = getElementIds(card);
      
      // Create a unique key for each source-target pair
      const groupKey = `${sourceElementId}->${targetElementId}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          cards: [],
          sourceElementId,
          targetElementId
        };
      }
      
      groups[groupKey].cards.push(card);
    });
    
    return Object.values(groups);
  };
  
  // Get grouped cards
  const cardGroups = groupCardsByElements();
  
  // Store card groups in ref for access in effects
  cardGroupsRef.current = cardGroups;
  
  // Reset animation state when overlay visibility changes
  useEffect(() => {
    if (isVisible) {
      // Count how many animations we'll have
      totalAnimations.current = cardGroupsRef.current.length;
      
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
  }, [isVisible, onClose]);

  // Only render if overlay is visible and we have animation data
  if (!isVisible || (!cardGroupsRef.current)) {
    return null;
  }
  
  return (
    <>
      {/* Render each group of cards as a separate animation */}
      {cardGroupsRef.current.map((group, index) => (
        <CardMovementAnimation
          key={`payment-animation-group-${index}-${Date.now()}`}
          isVisible={true}
          onClose={() => {}}
          animationData={group}
          animationConfig={animationConfig}
        />
      ))}
      {/* Add a safety timeout to ensure overlay closes */}
      {(() => {
        setTimeout(() => {
          onClose();
        }, 2000);
        return null; // Return null so nothing is rendered
      })()}
    </>
  );
};

export default PaymentSuccessfulOverlay;
