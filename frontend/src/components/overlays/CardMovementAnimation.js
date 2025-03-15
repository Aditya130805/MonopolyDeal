import React, { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import PropertyCard from '../cards/PropertyCard';
import { getPropertyWithDefaults } from '../../utils/gameUtils';

/**
 * A reusable component for animating card movement between two DOM elements
 * 
 * @param {Object} props Component props
 * @param {boolean} props.isVisible Whether the animation is visible
 * @param {Function} props.onClose Callback to close the overlay after animation completes
 * @param {Object} props.animationData Data needed for the animation
 * @param {Object} props.animationData.card The card object to animate
 * @param {string} props.animationData.sourceElementId DOM ID of the source element
 * @param {string} props.animationData.targetElementId DOM ID of the target element
 * @param {Object} props.animationConfig Optional animation configuration
 * @param {number} props.animationConfig.fadeInDuration Duration of fade-in animation in seconds
 * @param {number} props.animationConfig.moveDuration Duration of movement animation in seconds
 * @param {number} props.animationConfig.fadeOutDuration Duration of fade-out animation in seconds
 * @param {number} props.animationConfig.stiffness Spring stiffness for movement animation
 * @param {number} props.animationConfig.damping Spring damping for movement animation
 * @param {number} props.animationConfig.scale Scale of the card (0-1)
 * @param {Function} props.renderCard Custom function to render the card (receives card data and scale)
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

  // Default configuration with sensible defaults
  const config = {
    fadeInDuration: animationConfig.fadeInDuration || 0.3,
    moveDuration: animationConfig.moveDuration || 2.8,
    fadeOutDuration: animationConfig.fadeOutDuration || 0.4,
    stiffness: animationConfig.stiffness || 40,
    damping: animationConfig.damping || 12,
    scale: animationConfig.scale || 0.8,
    finalDelay: animationConfig.finalDelay || 50, // ms
  };

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
    if (!animationData || !animationData.card) return;
    
    const { card, sourceElementId, targetElementId } = animationData;
    
    // Try to find elements with a small delay to ensure DOM is ready
    let attempts = 0;
    const maxAttempts = 10;
    const attemptInterval = 100; // ms
    
    const tryAnimation = async () => {
      const sourcePosition = getElementPosition(sourceElementId);
      const targetPosition = getElementPosition(targetElementId);
      
      if (!sourcePosition || !targetPosition) {
        if (attempts < maxAttempts) {
          attempts++;
          console.log(`Attempt ${attempts}: Waiting for DOM elements to be ready...`);
          setTimeout(tryAnimation, attemptInterval);
        } else {
          console.log('Could not find source or target elements for animation after multiple attempts:', sourceElementId, targetElementId);
          onClose();
        }
        return;
      }
    
      // Get the initial position of the animating card
      const cardRect = animatingCardRef.current?.getBoundingClientRect();
      if (!cardRect) {
        onClose();
        return;
      }
      
      const startX = sourcePosition.x - cardRect.width / 2;
      const startY = sourcePosition.y - cardRect.height / 2;
      const endX = targetPosition.x - cardRect.width / 2;
      const endY = targetPosition.y - cardRect.height / 2;
    
      // Set initial position
      await cardAnimationControls.set({
        x: startX,
        y: startY,
        opacity: 0,
        scale: config.scale,
        zIndex: 9999,
        position: 'fixed',
      });
      
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
      
      // Small delay to ensure animation is complete before closing
      await new Promise(resolve => setTimeout(resolve, config.finalDelay));
      
      // Close the overlay after animation completes
      onClose();
    };
    
    // Start the animation attempt process
    tryAnimation();
  };

  useEffect(() => {
    if (isVisible && animationData && animationData.card) {
      // Start animation when overlay becomes visible
      animateCardMovement();
    }
  }, [isVisible, animationData, onClose]);

  // Default render function for property cards
  const defaultRenderCard = (card) => {
    const propertyWithDefaults = getPropertyWithDefaults(card);
    return <PropertyCard {...propertyWithDefaults} scale={config.scale} />;
  };

  // Use custom render function or default to PropertyCard
  const renderCardContent = renderCard || defaultRenderCard;

  return (
    isVisible && animationData && animationData.card ? (
      <motion.div
        ref={animatingCardRef}
        animate={cardAnimationControls}
        style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }}
      >
        {renderCardContent(animationData.card)}
      </motion.div>
    ) : null
  );
};

export default CardMovementAnimation;
