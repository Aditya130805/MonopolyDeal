import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from '../cards/PropertyCard';

const PropertyStealOverlay = ({ animation, onComplete, user }) => {
  useEffect(() => {
    if (animation) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [animation, onComplete]);

  if (!animation) return null;

  const { property, stealerId, targetId } = animation;
  const isUserStealing = stealerId === user.unique_id;

  // Ensure property has all required fields for PropertyCard
  const propertyWithDefaults = {
    name: property.name || 'Unknown',
    color: property.color || 'gray',
    value: property.value || 0,
    rent: property.rent || [1],
    isWild: property.isWild || false,
    isUtility: property.isUtility || false,
    isRailroad: property.isRailroad || false,
    width: 160,
    height: 220,
    ...property // Spread actual property values last to override defaults
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main container */}
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
            background: 'linear-gradient(45deg, #7B1FA2, #8E24AA, #9C27B0)',
            padding: 'clamp(20px, 5vw, 40px) clamp(30px, 8vw, 60px)',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(123, 31, 162, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            maxWidth: '90vw'
          }}
        >
          {/* Background steal symbols */}
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
            {'🎯 🎪 🎭 '.repeat(5).split(' ').map((emoji, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
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
          <div className="relative flex flex-col items-center gap-6">
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
                scale: {
                  duration: 2,
                  repeat: Infinity,
                }
              }}
              className="text-4xl font-extrabold text-white text-center"
              style={{
                textShadow: '3px 3px 0px rgba(0,0,0,0.2)',
              }}
            >
              {isUserStealing ? 'Sly Deal!' : 'Property Stolen!'}
            </motion.div>

            {/* Cards */}
            <div className="flex justify-between mt-4 relative" style={{ 
              minHeight: 'clamp(200px, 50vw, 280px)', 
              width: 'clamp(300px, 80vw, 600px)',
              margin: '0 auto'
            }}>
              {/* Source */}
              <div className="text-center" style={{ width: 'clamp(100px, 20vw, 160px)' }}>
                <motion.div
                  className="text-xl font-bold text-white/90 mb-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}
                >
                  {isUserStealing ? 'From Opponent' : 'From You'}
                </motion.div>
                <motion.div
                  initial={{ x: 0 }}
                  animate={{ x: 'clamp(220px, 55vw, 440px)' }}
                  transition={{ 
                    duration: 1,
                    ease: "easeInOut",
                  }}
                  style={{ 
                    position: 'relative',
                    zIndex: 2 
                  }}
                >
                  <PropertyCard {...propertyWithDefaults} />
                </motion.div>
              </div>

              {/* Arrow */}
              <motion.div 
                className="text-5xl text-white absolute left-1/2 -translate-x-1/2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.3,
                  duration: 0.5,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.2)' }}
              >
                <motion.span
                  animate={{ x: [0, 10, 0] }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{ display: 'inline-block' }}
                >
                  →
                </motion.span>
              </motion.div>

              {/* Destination */}
              <div className="text-center" style={{ width: 'clamp(100px, 20vw, 160px)' }}>
                <motion.div
                  className="text-xl font-bold text-white/90 mb-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}
                >
                  {isUserStealing ? 'To You' : 'To Opponent'}
                </motion.div>
              </div>
            </div>

            {/* Property name */}
            <motion.div
              className="text-2xl text-white/90 font-bold mt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}
            >
              {propertyWithDefaults.name}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PropertyStealOverlay;
