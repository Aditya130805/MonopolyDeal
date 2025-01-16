import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from '../cards/PropertyCard';

const PropertySwapOverlay = ({ animation, onComplete, user }) => {
  useEffect(() => {
    if (animation) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [animation, onComplete]);

  if (!animation) return null;

  const { property1, property2, player1Id, player2Id } = animation;
  const isUserInvolved = player1Id === user.unique_id || player2Id === user.unique_id;
  const isUserPlayer1 = player1Id === user.unique_id;

  // Ensure properties have all required fields for PropertyCard
  const property1WithDefaults = {
    name: property1.name || 'Unknown',
    color: property1.color || 'gray',
    value: property1.value || 0,
    rent: property1.rent || [],
    isWild: property1.isWild || false,
    isUtility: property2.isUtility || false,
    isRailroad: property2.isRailroad || false,
    width: 160,
    height: 220
  };

  const property2WithDefaults = {
    name: property2.name || 'Unknown',
    color: property2.color || 'gray',
    value: property2.value || 0,
    rent: property2.rent || [],
    isWild: property2.isWild || false,
    isUtility: property2.isUtility || false,
    isRailroad: property2.isRailroad || false,
    width: 160,
    height: 220
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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
          {/* Title */}
          <motion.div
            className="text-3xl font-bold text-white text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}
          >
            {isUserInvolved ? (isUserPlayer1 ? 'Property Swap!' : 'Properties Swapped!') : 'Property Swap!'}
          </motion.div>

          {/* Card container */}
          <div className="flex justify-center items-center gap-12 relative">
            {/* Left card */}
            <motion.div
              initial={{ x: isUserPlayer1 ? -400 : 400, opacity: 0 }}
              animate={{ 
                x: 0,
                opacity: 1,
              }}
              exit={{ 
                x: isUserPlayer1 ? 400 : -400,
                opacity: 0 
              }}
              transition={{
                duration: 1,
                ease: "easeInOut"
              }}
            >
              <PropertyCard {...property1WithDefaults} />
            </motion.div>

            {/* Swap icon */}
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{ 
                scale: 1,
                rotate: 360
              }}
              transition={{
                duration: 0.7,
                ease: "backOut"
              }}
              className="text-white text-4xl"
            >
              ↔️
            </motion.div>

            {/* Right card */}
            <motion.div
              initial={{ x: isUserPlayer1 ? 400 : -400, opacity: 0 }}
              animate={{ 
                x: 0,
                opacity: 1
              }}
              exit={{ 
                x: isUserPlayer1 ? -400 : 400,
                opacity: 0 
              }}
              transition={{
                duration: 1,
                ease: "easeInOut"
              }}
            >
              <PropertyCard {...property2WithDefaults} />
            </motion.div>
          </div>

          {/* Property names */}
          <div className="flex justify-center items-center gap-12 mt-6">
            <motion.div 
              className="text-white/90 font-medium text-center w-[160px]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {isUserPlayer1 ? 'Your New Property' : 'Traded to Opponent'}
            </motion.div>
            <div className="w-[48px]" /> {/* Spacer for swap icon */}
            <motion.div 
              className="text-white/90 font-medium text-center w-[160px]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {isUserPlayer1 ? 'Traded to Opponent' : 'Your New Property'}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PropertySwapOverlay;
