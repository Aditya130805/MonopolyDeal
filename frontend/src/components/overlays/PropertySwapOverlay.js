import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from '../cards/PropertyCard';
import { useAuth } from '../../contexts/AuthContext';
import { useGameState } from '../../contexts/GameStateContext';
import { colorMap, getPropertyWithDefaults } from '../../utils/gameUtils';

const PropertySwapOverlay = ({ isVisible, onClose, overlayData }) => {
  const { user } = useAuth();
  const { gameState } = useGameState();
  
  const property1 = overlayData?.property1;
  const property2 = overlayData?.property2;
  const player1Id = overlayData?.player1Id;
  const player2Id = overlayData?.player2Id;
  const player1Name = gameState?.players.find(p => p.id === player1Id)?.name;
  const player2Name = gameState?.players.find(p => p.id === player2Id)?.name;

  useEffect(() => {
    if (isVisible) {
      // Auto-close the overlay after 2 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const isUserInvolved = player1Id === user.unique_id || player2Id === user.unique_id;
  const isUserPlayer1 = player1Id === user.unique_id;

  const getColorStyle = (property) => {
    return property ? (colorMap[property.color] || { bg: '#4A5568', text: '#FFFFFF', gradient: ['#4A5568DD', '#5A6678DD', '#6B7888DD'] }) : {};
  };

  const colorStyle = getColorStyle(property1);

  const property1WithDefaults = property1 ? getPropertyWithDefaults(property1) : null;
  const property2WithDefaults = property2 ? getPropertyWithDefaults(property2) : null;

  return (
    <AnimatePresence mode="wait" onExitComplete={onClose}>
      {isVisible && overlayData && (
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
                {'🔄 💫 ⚡️'.repeat(5).split(' ').map((emoji, i) => (
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
                  animate={{ y: 0, opacity: 1 }}
                  className="text-center mb-6"
                >
                  <h2 className={`text-2xl font-bold mb-2`} style={{ color: colorStyle.text }}>
                    Forced Deal!
                  </h2>
                  <p className={`text-lg opacity-90 mb-1`} style={{ color: colorStyle.text }}>
                    {isUserInvolved 
                      ? (isUserPlayer1 ? "You initiated a property swap!" : "Your property was swapped!")
                      : "Properties were swapped!"}
                  </p>
                  <p className={`text-sm opacity-80`} style={{ color: colorStyle.text }}>
                    {player1Name} swapped with {player2Name}
                  </p>
                </motion.div>

                {/* Cards Container */}
                <div className="flex justify-center items-center gap-4">
                  {/* Left Card (Old Property) */}
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {isUserPlayer1 ? (
                      <PropertyCard {...property2WithDefaults} />
                    ) : player2Id === user.unique_id ? (
                      <PropertyCard {...property1WithDefaults} />
                    ) : (
                      <PropertyCard {...property1WithDefaults} />
                    )}
                  </motion.div>

                  {/* Swap Arrow */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl"
                    style={{ color: colorStyle.text }}
                  >
                    ↔️
                  </motion.div>

                  {/* Right Card (New Property) */}
                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {isUserPlayer1 ? (
                      <PropertyCard {...property1WithDefaults} />
                    ) : player2Id === user.unique_id ? (
                      <PropertyCard {...property2WithDefaults} />
                    ) : (
                      <PropertyCard {...property2WithDefaults} />
                    )}
                  </motion.div>
                </div>

                {/* Property Labels */}
                <div className="flex justify-center items-center gap-4 mt-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center"
                    style={{ color: colorStyle.text, width: '160px' }}
                  >
                    {isUserInvolved ? "Your Old Property" : `${isUserPlayer1 ? "Player 1's" : "Player 2's"} Old Property`}
                  </motion.div>
                  <div style={{ width: '40px' }}></div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center"
                    style={{ color: colorStyle.text, width: '160px' }}
                  >
                    {isUserInvolved ? "Your New Property" : `${isUserPlayer1 ? "Player 1's" : "Player 2's"} New Property`}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PropertySwapOverlay;
