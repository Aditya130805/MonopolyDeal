import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CardNotification = ({ card, isVisible, onComplete, actionType }) => {
  if (!card) {
    return null;
  }

  const [localVisible, setLocalVisible] = useState(isVisible);

  useEffect(() => {
    setLocalVisible(isVisible);
    if (isVisible) {
      const timer = setTimeout(() => {
        setLocalVisible(false);
        if (onComplete) onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  const getCardEmoji = (card, actionType) => {
    // If the card is going to bank, show money emoji
    if (actionType === 'to_bank') {
      return '💵';
    }
    
    // If it's a property being placed, show house emoji
    if (actionType === 'to_properties') {
      return '🏠';
    }
    
    // For action cards being played as actions
    if (card.type === 'action' && actionType === 'action') {
      switch (card.name.toLowerCase()) {
        case 'pass go': return '🎲';
        case 'deal breaker': return '💥';
        case 'debt collector': return '💰';
        case 'forced deal': return '🔄';
        case 'sly deal': return '🦊';
        case 'just say no': return '🚫';
        case 'double rent': return '💲';
        case 'rent': return '🏦';
        default: return '🎯';
      }
    }
    
    // Fallback emojis based on card type
    return card.type === 'property' ? '🏠' : '💵';
  };

  const getCardColor = (card, actionType) => {
    // If the card is going to bank, use money color
    if (actionType === 'to_bank') {
      return 'linear-gradient(135deg, #FFD700, #FFC107)';
    }
    
    // For property cards or cards going to properties
    if (card.type === 'property' || actionType === 'to_properties') {
      const colorMap = {
        brown: 'linear-gradient(135deg, #795548, #8D6E63)',
        'light blue': 'linear-gradient(135deg, #03A9F4, #4FC3F7)',
        pink: 'linear-gradient(135deg, #E91E63, #F06292)',
        orange: 'linear-gradient(135deg, #FF9800, #FFB74D)',
        red: 'linear-gradient(135deg, #F44336, #EF5350)',
        yellow: 'linear-gradient(135deg, #FDD835, #FFEE58)',
        green: 'linear-gradient(135deg, #4CAF50, #81C784)',
        blue: 'linear-gradient(135deg, #2196F3, #64B5F6)',
        black: 'linear-gradient(135deg, #424242, #757575)',
        mint: 'linear-gradient(135deg, #D1FAE5, #99FFCC)',
      };
      return colorMap[card.currentColor?.toLowerCase()] || 'linear-gradient(135deg, #4CAF50, #81C784)';
    }
    
    // For action cards being played as actions
    if (card.type === 'action' && actionType === 'action') {
      return 'linear-gradient(135deg, #FF6B6B, #FF8E8E)';
    }
    
    return 'linear-gradient(135deg, #FFD700, #FFC107)';
  };

  return (
    <AnimatePresence>
      {localVisible && (
        <motion.div
          initial={{ x: 100, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 100, opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '15px',
            borderRadius: '12px',
            color: '#333',
            zIndex: 1000,
            maxWidth: '300px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <motion.div 
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              style={{ 
                width: '50px', 
                height: '70px', 
                background: getCardColor(card, actionType),
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5em',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
              }}
            >
              {getCardEmoji(card, actionType)}
            </motion.div>
            <div>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '5px',
                fontSize: '1.1em',
                color: '#1a1a1a',
                textAlign: 'left'
              }}>
                Card Played
              </div>
              <div style={{ 
                fontSize: '0.95em',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                {card && card.name ? card.name.charAt(0).toUpperCase() + card.name.slice(1) : card.type.charAt(0).toUpperCase() + card.type.slice(1)}
                {card && card.value && <span style={{ color: '#4CAF50' }}>(${card.value}M)</span>}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CardNotification;
