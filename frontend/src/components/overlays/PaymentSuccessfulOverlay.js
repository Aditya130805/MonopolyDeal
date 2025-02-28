import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from '../cards/PropertyCard';
import ActionCard from '../cards/ActionCard';
import MoneyCard from '../cards/MoneyCard';
// import { useGameState } from '../../contexts/GameStateContext';

const PaymentSuccessfulOverlay = ({ isVisible, onClose, overlayData }) => {
  // const { gameState } = useGameState();
  const gameState = overlayData?.gameState;
  const playerId = overlayData?.playerId;
  const targetId = overlayData?.targetId;
  const selectedCards = overlayData?.selectedCards || [];
  
  const player = gameState?.players.find(p => p.id === playerId);
  const target = gameState?.players.find(p => p.id === targetId);

  const colorStyle = {
    bg: '#4A5568',
    text: '#FFFFFF',
    gradient: ['#4A5568DD', '#5A6678DD', '#6B7888DD']
  };

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence mode="wait" onExitComplete={onClose}>
      {isVisible && overlayData && player && target && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          <div style={{ position: 'relative' }}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: 1,
                opacity: 1,
              }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{
                duration: 0.7,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              style={{
                background: `linear-gradient(45deg, ${colorStyle.gradient[0]}, ${colorStyle.gradient[1]}, ${colorStyle.gradient[2]})`,
                padding: '40px 60px',
                borderRadius: '20px',
                boxShadow: `0 10px 30px ${colorStyle.bg}4D`,
                position: 'relative',
                overflow: 'hidden',
                minWidth: 'min-content',
                backdropFilter: 'brightness(0.9)'
              }}
            >
              {/* Background symbols */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0.1, 0.15, 0.1],
                }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                  fontSize: '24px',
                  color: 'white',
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              >
                {'💰 💵 💸'.repeat(5).split(' ').map((emoji, i) => (
                  <motion.span
                    key={i}
                    animate={{
                      y: [0, -10, 0],
                      rotate: [-5, 5, -5],
                    }}
                    transition={{
                      duration: 3,
                      ease: "easeInOut",
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    style={{ margin: '5px' }}
                  >
                    {emoji}
                  </motion.span>
                ))}
              </motion.div>

              {/* Content */}
              <div className="relative z-10">
                {/* Title */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ 
                    y: 0,
                    opacity: 1,
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                >
                  <h1 
                    className="text-4xl font-extrabold text-white text-center mb-6"
                    style={{
                      textShadow: '3px 3px 0px rgba(0,0,0,0.2)',
                    }}
                  >
                    PAYMENT MADE!
                  </h1>
                </motion.div>

                {/* Player Names */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ 
                    scale: 1,
                    opacity: 1,
                  }}
                  transition={{
                    duration: 0.6,
                    ease: [0.34, 1.56, 0.64, 1],
                    delay: 0.2
                  }}
                  className="text-2xl text-white text-center font-semibold mb-8"
                  style={{
                    textShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                  }}
                >
                  <span 
                    className="font-bold"
                    style={{ 
                      color: '#f87171',
                      textShadow: '2px 2px 0px rgba(0,0,0,0.2)'
                    }}
                  >
                    {player.name}
                  </span>
                  <span className="mx-2">paid</span>
                  <span 
                    className="font-bold"
                    style={{ 
                      color: '#4ade80',
                      textShadow: '2px 2px 0px rgba(0,0,0,0.2)'
                    }}
                  >
                    {target.name}
                  </span>
                </motion.div>

                {/* No Payment Message */}
                {selectedCards.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/80 text-lg text-center italic mb-6"
                  >
                    (No cards to pay with)
                  </motion.div>
                )}

                {/* Cards Display */}
                <motion.div
                  className="flex justify-center items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex -space-x-20 relative">
                    {selectedCards.map((card, index) => {
                      let CardComponent = card.type === 'money' ? MoneyCard 
                                      : card.type === 'property' ? PropertyCard 
                                      : ActionCard;

                      return (
                        <motion.div
                          key={card.id}
                          className="relative"
                          style={{ zIndex: index }}
                          initial={{ 
                            opacity: 0,
                            x: -30,
                            y: 20,
                          }}
                          animate={{ 
                            opacity: 1,
                            x: 0,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.5,
                            delay: 0.1 * index + 0.5,
                            ease: [0.34, 1.56, 0.64, 1],
                          }}
                        >
                          <CardComponent {...card} />
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentSuccessfulOverlay;
