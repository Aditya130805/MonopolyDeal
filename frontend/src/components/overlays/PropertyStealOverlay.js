import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from '../cards/PropertyCard';
import { useAuth } from '../../contexts/AuthContext';
import { useGameState } from '../../contexts/GameStateContext';
import { colorMap, getPropertyWithDefaults } from '../../utils/gameUtils';

const PropertyStealOverlay = ({ isVisible, onClose, overlayData }) => {
  const { user } = useAuth();
  const { gameState } = useGameState();

  const property = overlayData?.property;  // The actual property object
  const stealerId = overlayData?.stealerId;
  const targetId = overlayData?.targetId;
  const stealerName = gameState?.players.find(p => p.id === stealerId)?.name;
  const targetName = gameState?.players.find(p => p.id === targetId)?.name;

  useEffect(() => {
    if (isVisible) {
      // Auto-close the overlay after 2 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const isUserStealing = stealerId === user.unique_id;

  const colorStyle = property ? (colorMap[property.color] || { bg: '#4A5568', text: '#FFFFFF', gradient: ['#4A5568DD', '#5A6678DD', '#6B7888DD'] }) : {};

  const propertyWithDefaults = property ? getPropertyWithDefaults(property) : null;

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
                {'🎯 💫 ⚡️'.repeat(5).split(' ').map((emoji, i) => (
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
                    Sly Deal!
                  </h2>
                  <p className={`text-lg opacity-90 mb-1`} style={{ color: colorStyle.text }}>
                    {isUserStealing ? "You stole a property!" : "Your property was stolen!"}
                  </p>
                  <p className={`text-sm opacity-80`} style={{ color: colorStyle.text }}>
                    {stealerName} stole from {targetName}
                  </p>
                </motion.div>

                {/* Card */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-center items-center"
                >
                  <PropertyCard {...propertyWithDefaults} />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PropertyStealOverlay;
