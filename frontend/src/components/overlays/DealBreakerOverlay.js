import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from '../cards/PropertyCard';
import ActionCard from '../cards/ActionCard';

const DealBreakerOverlay = ({ isVisible, playerName, targetName, color, propertySet, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const colorMap = {
    'brown': { bg: '#8B4513', text: '#F3EBE5', gradient: ['#8B4513DD', '#A0522DDD', '#B8860BDD'] },
    'light blue': { bg: '#87CDDB', text: '#F0FAFF', gradient: ['#87CDDBDD', '#98D3EDDD', '#ADD8E6DD'] },
    'pink': { bg: '#FF1493', text: '#FFF0F7', gradient: ['#FF1493DD', '#FF69B4DD', '#FFB6C1DD'] },
    'orange': { bg: '#FF7C2D', text: '#FFF4F0', gradient: ['#FF7C2DDD', '#FFA54FDD', '#FFB366DD'] },
    'red': { bg: '#FF0000', text: '#FFF0F0', gradient: ['#FF0000DD', '#FF4444DD', '#FF6666DD'] },
    'yellow': { bg: '#FFE026', text: '#FFFBF0', gradient: ['#FFE026DD', '#FFE44DDD', '#FFE875DD'] },
    'green': { bg: '#00A352', text: '#F0FFF7', gradient: ['#00A352DD', '#00B359DD', '#00C364DD'] },
    'blue': { bg: '#0055DD', text: '#F0F7FF', gradient: ['#0055DDDD', '#1E69FFDD', '#3C7FFFDD'] },
    'mint': { bg: '#C8E0CF', text: '#F2F9F4', gradient: ['#C8E0CFDD', '#D1E6D7DD', '#DAECDFDD'] },
    'black': { bg: '#1A1A1A', text: '#F8F8F8', gradient: ['#1A1A1ADD', '#2D2D2DDD', '#404040DD'] }
  };

  const colorStyle = colorMap[color] || { bg: '#4A5568', text: '#FFFFFF', gradient: ['#4A5568DD', '#5A6678DD', '#6B7888DD'] };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
                {'🏠 💰 ⚡️'.repeat(5).split(' ').map((emoji, i) => (
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
                    className="text-6xl font-extrabold text-white text-center mb-6"
                    style={{
                      textShadow: '3px 3px 0px rgba(0,0,0,0.2)',
                    }}
                  >
                    DEAL BREAKER!
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
                      color: '#4ade80',
                      textShadow: '2px 2px 0px rgba(0,0,0,0.2)'
                    }}
                  >
                    {playerName}
                  </span>
                  <span className="mx-2">stole</span>
                  <span 
                    className="font-bold"
                    style={{ 
                      color: '#f87171',
                      textShadow: '2px 2px 0px rgba(0,0,0,0.2)'
                    }}
                  >
                    {targetName}'s
                  </span>
                  <div className="mt-1">
                    <span>complete</span>
                    <span className="mx-2 font-bold text-white">
                      {color}
                    </span>
                    <span>set!</span>
                  </div>
                </motion.div>

                {/* Property Set Display */}
                <motion.div
                  className="flex justify-center items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex -space-x-20 relative">
                    {propertySet.map((card, index) => (
                      <motion.div
                        key={card.id}
                        className="relative"
                        style={{ zIndex: propertySet.length - index }}
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
                          delay: 0.6 + index * 0.1,
                          duration: 0.4,
                          ease: [0.34, 1.56, 0.64, 1],
                        }}
                      >
                        {card.type === 'property' ? (
                          <PropertyCard {...card} />
                        ) : (card.type === 'action') ? (
                          <ActionCard {...card} />
                        ) : null}
                      </motion.div>
                    ))}
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

export default DealBreakerOverlay;
