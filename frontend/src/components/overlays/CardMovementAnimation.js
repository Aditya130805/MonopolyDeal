import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import PropertyCard from '../cards/PropertyCard';
import MoneyCard from '../cards/MoneyCard';
import ActionCard from '../cards/ActionCard';
import { getPropertyWithDefaults } from '../../utils/gameUtils';

/**
 * A reusable component for animating card movement between two DOM elements
 * 
 * @param {Object} props Component props
 * @param {boolean} props.isVisible Whether the animation is visible
 * @param {Function} props.onClose Callback to close the overlay after animation completes
 * @param {Object|Array} props.animationData Data needed for the animation - can be a single card object or an array of cards
 * @param {Object} props.animationData.card The card object to animate (when single card)
 * @param {Array} props.animationData.cards Array of card objects to animate (when multiple cards)
 * @param {string} props.animationData.sourceElementId DOM ID of the source element
 * @param {string} props.animationData.targetElementId DOM ID of the target element
 * @param {Object} props.animationConfig Optional animation configuration
 * @param {number} props.animationConfig.fadeInDuration Duration of fade-in animation in seconds
 * @param {number} props.animationConfig.moveDuration Duration of movement animation in seconds
 * @param {number} props.animationConfig.fadeOutDuration Duration of fade-out animation in seconds
 * @param {number} props.animationConfig.stiffness Spring stiffness for movement animation
 * @param {number} props.animationConfig.damping Spring damping for movement animation
 * @param {number} props.animationConfig.scale Scale of the card (0-1)
 * @param {number} props.animationConfig.cardOffset Horizontal offset between cards when animating multiple cards
 * @param {Function} props.renderCard Custom function to render the card (receives card data, index, and total count)
 */
const CardMovementAnimation = ({ 
  isVisible, 
  onClose, 
  animationData,
  animationConfig = {},
  renderCard
}) => {
  // Animation state controlled by useState instead of useAnimation
  const [animationState, setAnimationState] = useState({
    opacity: 0,
    scale: 0,
    x: 0,
    y: 0,
    zIndex: 9999,
    position: 'fixed'
  });
  
  // Animation phases
  const [animationPhase, setAnimationPhase] = useState('initial'); // 'initial', 'fadeIn', 'move', 'fadeOut', 'complete'
  
  const animatingCardRef = useRef(null);
  const cardsContainerRef = useRef(null);

  // Default configuration with sensible defaults
  const config = {
    fadeInDuration: animationConfig.fadeInDuration || 0.3,
    moveDuration: animationConfig.moveDuration || 2.8,
    fadeOutDuration: animationConfig.fadeOutDuration || 0.4,
    stiffness: animationConfig.stiffness || 40,
    damping: animationConfig.damping || 12,
    scale: animationConfig.scale || 0.8,
    cardOffset: animationConfig.cardOffset || 30, // horizontal offset between cards in pixels
    finalDelay: animationConfig.finalDelay || 50, // ms
  };
  
  // Determine if we're dealing with multiple cards or a single card
  const isMultipleCards = Array.isArray(animationData?.cards) && animationData.cards.length > 0;
  const cards = isMultipleCards ? animationData.cards : (animationData?.card ? [animationData.card] : []);
  
  // Get the base width of a card for calculations
  const width = 160; // Base card width
  const height = 220;

  // Function to get element position
  const getElementPosition = (elementId) => {
    const element = document.getElementById(elementId);
    if (!element) return null;
    
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  };

  // Function to animate card movement
  const animateCardMovement = () => {
    if (!animationData || (!animationData.card && !isMultipleCards)) return;
    
    const { sourceElementId, targetElementId } = animationData;
    
    // Try to find elements with a small delay to ensure DOM is ready
    let attempts = 0;
    const maxAttempts = 15; // Increased max attempts
    const attemptInterval = 150; // ms - slightly longer interval
    
    const tryAnimation = () => {
      const sourcePosition = getElementPosition(sourceElementId);
      const targetPosition = getElementPosition(targetElementId);
      
      if (!sourcePosition || !targetPosition) {
        if (attempts < maxAttempts) {
          attempts++;
          console.log(`Attempt ${attempts}: Waiting for DOM elements to be ready...`, sourceElementId, targetElementId);
          setTimeout(tryAnimation, attemptInterval);
        } else {
          console.log('Could not find source or target elements for animation after multiple attempts:', sourceElementId, targetElementId);
          onClose();
        }
        return;
      }
    
      // Since the container might not have proper dimensions yet, use predefined card dimensions
      // Get a reference to the container for positioning
      const containerRef = cardsContainerRef.current;
      if (!containerRef) {
        onClose();
        return;
      }
      
      // Calculate the total width of all cards including overlap
      const totalCardsWidth = cards.length > 0 
        ? width + (Math.abs(config.cardOffset) * (cards.length - 1))
        : width;
      
      // Use the predefined card dimensions instead of container measurements
      const cardWidth = width;
      const cardHeight = height;
      
      // Calculate the center offset to ensure the center of the card pack aligns with source/target
      const centerOffsetX = totalCardsWidth / 2 - cardWidth / 2;
      
      // Position the container so its center aligns with source/target elements
      const startX = sourcePosition.x - cardWidth / 2 - centerOffsetX;
      const startY = sourcePosition.y - cardHeight / 2;
      const endX = targetPosition.x - cardWidth / 2 - centerOffsetX;
      const endY = targetPosition.y - cardHeight / 2;
    
      // Set initial position
      setAnimationState({
        x: startX,
        y: startY,
        opacity: 0,
        scale: config.scale,
        zIndex: 9999,
        position: 'fixed',
      });
      
      // Start animation sequence
      setTimeout(() => {
        // Phase 1: Fade In
        setAnimationPhase('fadeIn');
        setAnimationState(prev => ({
          ...prev,
          opacity: 1,
          scale: 1
        }));
        
        // Phase 2: Move
        setTimeout(() => {
          setAnimationPhase('move');
          setAnimationState(prev => ({
            ...prev,
            x: endX,
            y: endY
          }));
          
          // Phase 3: Fade Out
          setTimeout(() => {
            setAnimationPhase('fadeOut');
            setAnimationState(prev => ({
              ...prev,
              opacity: 0,
              scale: config.scale
            }));
            
            // Phase 4: Complete
            setTimeout(() => {
              setAnimationPhase('complete');
              setTimeout(() => {
                onClose();
              }, config.finalDelay);
            }, config.fadeOutDuration * 1000);
          }, config.moveDuration * 1000);
        }, config.fadeInDuration * 1000);
      }, 100);
    };
    
    // Start the animation attempt process
    tryAnimation();
  };
  
  useEffect(() => {
    let animationTimeout;
    
    if (isVisible && animationData && (animationData.card || isMultipleCards)) {
      // Add a small delay before starting animation to ensure component is fully mounted
      animationTimeout = setTimeout(() => {
        setAnimationPhase('initial');
        animateCardMovement();
      }, 200); // Increased delay for more reliability
    }
    
    // Clean up timeout if component unmounts
    return () => {
      if (animationTimeout) clearTimeout(animationTimeout);
    };
  }, [isVisible, animationData]);

  // Default render function for all cards
  const defaultRenderCard = (card, index, totalCards) => {
    if (!card) return null;
    if (card.type === 'property') {
      const propertyWithDefaults = getPropertyWithDefaults(card);
      return <PropertyCard {...propertyWithDefaults} scale={config.scale} />;
    } else if (card.type === 'money') {
      return <MoneyCard {...card} scale={config.scale} />;
    } else {
      return <ActionCard {...card} scale={config.scale} />;
    }
  };

  // Use custom render function or default to PropertyCard
  const renderCardContent = renderCard || defaultRenderCard;

  // Generate the transition properties based on the animation phase
  const getTransition = () => {
    switch (animationPhase) {
      case 'fadeIn':
        console.log("fadeIn");
        return { duration: config.fadeInDuration, ease: 'easeIn' };
      case 'move':
        console.log("move");
        return { 
          type: 'spring', 
          stiffness: config.stiffness, 
          damping: config.damping, 
          duration: config.moveDuration 
        };
      case 'fadeOut':
        console.log("fadeOut");
        return { duration: config.fadeOutDuration, ease: 'easeOut' };
      default:
        console.log("default");
        return { duration: 0 };
    }
  };
  
  return (
    isVisible && animationData && cards.length > 0 ? (
      <motion.div
        ref={cardsContainerRef}
        animate={animationState}
        transition={getTransition()}
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          pointerEvents: 'none', 
          zIndex: 9999,
          visibility: animationPhase !== 'initial' ? 'visible' : 'hidden' // Hide until animation starts
        }}
      >
        <div className="flex" style={{ position: 'relative' }}>
          {cards.map((card, index) => (
            <div 
              key={card.id || `card-${index}`}
              ref={index === 0 ? animatingCardRef : null}
              style={{ 
                position: 'relative', 
                left: `${index * config.cardOffset}px`,
                zIndex: index + 1 // Reverse z-index so later cards appear on top
              }}
            >
              {renderCardContent(card, index, cards.length)}
            </div>
          ))}
        </div>
      </motion.div>
    ) : null
  );
};

export default CardMovementAnimation;
