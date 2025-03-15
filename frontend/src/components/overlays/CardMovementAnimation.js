import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import PropertyCard from '../cards/PropertyCard';
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
  const cardAnimationControls = useAnimation();
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
  const animateCardMovement = async () => {
    if (!animationData || (!animationData.card && !isMultipleCards)) return;
    
    const { sourceElementId, targetElementId } = animationData;
    
    // Try to find elements with a small delay to ensure DOM is ready
    let attempts = 0;
    const maxAttempts = 15; // Increased max attempts
    const attemptInterval = 150; // ms - slightly longer interval
    
    const tryAnimation = async () => {
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
    
      // Get the initial position of the animating cards container
      const containerRect = cardsContainerRef.current?.getBoundingClientRect();
      if (!containerRect) {
        onClose();
        return;
      }
      
      // Calculate the total width of all cards including overlap
      const totalCardsWidth = cards.length > 0 
        ? width + (Math.abs(config.cardOffset) * (cards.length - 1))
        : containerRect.width;
      
      // Calculate the center offset to ensure the center of the card pack aligns with source/target
      const centerOffsetX = totalCardsWidth / 2 - containerRect.width / 2;
      
      // Position the container so its center aligns with source/target elements
      const startX = sourcePosition.x - containerRect.width / 2 - centerOffsetX;
      const startY = sourcePosition.y - containerRect.height / 2;
      const endX = targetPosition.x - containerRect.width / 2 - centerOffsetX;
      const endY = targetPosition.y - containerRect.height / 2;
    
      // Set initial position
      cardAnimationControls.set({
        x: startX,
        y: startY,
        opacity: 0,
        scale: config.scale,
        zIndex: 9999,
        position: 'fixed',
      });
      
      // Use setTimeout to ensure the component is fully mounted before starting animations
      setTimeout(async () => {
        try {
          // Add a visibility check before starting animation
          if (!document.hidden) {
            // Animate to visibility
            await cardAnimationControls.start({
              opacity: 1,
              scale: 1,
              transition: { duration: config.fadeInDuration }
            });
            
            // Animate to target position
            await cardAnimationControls.start({
              x: endX,
              y: endY,
              transition: {
                type: 'spring',
                stiffness: config.stiffness,
                damping: config.damping,
                duration: config.moveDuration
              }
            });
            
            // Fade out with a smoother transition
            await cardAnimationControls.start({
              opacity: 0,
              scale: config.scale,
              transition: { 
                duration: config.fadeOutDuration,
                ease: 'easeOut'
              }
            });
          }
          
          // Small delay to ensure animation is complete before closing
          setTimeout(() => {
            onClose();
          }, config.finalDelay);
        } catch (error) {
          console.error('Animation error:', error);
          // Don't immediately close on error, give it a small delay
          setTimeout(() => {
            onClose();
          }, 500);
        }
      }, 100); // Slightly longer delay to ensure component is mounted
    };
    
    // Start the animation attempt process
    tryAnimation();
  };

  // Handle visibility change events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isVisible) {
        // If tab becomes hidden during animation, ensure we still complete
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isVisible, onClose]);
  
  useEffect(() => {
    let animationTimeout;
    
    if (isVisible && animationData && (animationData.card || isMultipleCards)) {
      // Add a small delay before starting animation to ensure component is fully mounted
      animationTimeout = setTimeout(() => {
        animateCardMovement();
      }, 200); // Increased delay for more reliability
    }
    
    // Clean up timeout if component unmounts
    return () => {
      if (animationTimeout) clearTimeout(animationTimeout);
    };
  }, [isVisible, animationData]);

  // Default render function for property cards
  const defaultRenderCard = (card, index, totalCards) => {
    const propertyWithDefaults = getPropertyWithDefaults(card);
    return <PropertyCard {...propertyWithDefaults} scale={config.scale} />;
  };

  // Use custom render function or default to PropertyCard
  const renderCardContent = renderCard || defaultRenderCard;

  // State to track if initial positioning has been set
  const [isPositioned, setIsPositioned] = useState(false);
  
  // Set initial position before rendering cards
  useEffect(() => {
    if (isVisible && animationData && cards.length > 0 && !isPositioned) {
      // Initially hide the cards with opacity 0
      cardAnimationControls.set({
        opacity: 0,
        position: 'fixed',
        zIndex: 9999
      });
      setIsPositioned(true);
    }
  }, [isVisible, animationData, cards.length, isPositioned]);
  
  return (
    isVisible && animationData && cards.length > 0 ? (
      <motion.div
        ref={cardsContainerRef}
        animate={cardAnimationControls}
        initial={{ opacity: 0 }}
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          pointerEvents: 'none', 
          zIndex: 9999,
          visibility: isPositioned ? 'visible' : 'hidden' // Hide until positioned
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
                zIndex: cards.length - index
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
