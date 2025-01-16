import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from '../cards/PropertyCard';

const DealBreakerOverlay = ({ isVisible, playerName, targetName, color, propertySet, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const colorMap = {
    'brown': { bg: '#8B4513', text: '#F3EBE5' },
    'light blue': { bg: '#87CEEB', text: '#F0FAFF' },
    'pink': { bg: '#FF1493', text: '#FFF0F7' },
    'orange': { bg: '#FF7C2D', text: '#FFF4F0' },
    'red': { bg: '#FF0000', text: '#FFF0F0' },
    'yellow': { bg: '#FFE026', text: '#FFFBF0' },
    'green': { bg: '#00A352', text: '#F0FFF7' },
    'blue': { bg: '#0055EE', text: '#F0F7FF' },
    'mint': { bg: '#C8E0CF', text: '#F2F9F4' },
    'black': { bg: '#1A1A1A', text: '#F8F8F8' }
  };

  const colorStyle = colorMap[color] || { bg: '#4A5568', text: '#FFFFFF' };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Background with color flash */}
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.7, 0.7],
              backgroundColor: ['#000', colorStyle.bg, '#000']
            }}
            transition={{ duration: 3, times: [0, 0.3, 1] }}
          />

          {/* Lightning effect */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 0.5, times: [0, 0.1, 1], delay: 0.2 }}
          >
            <div className="absolute inset-0" style={{
              background: `radial-gradient(circle at 50% 50%, ${colorStyle.bg}44 0%, transparent 70%)`
            }} />
          </motion.div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Title Animation */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-8"
            >
              <h1 className="text-6xl font-extrabold text-red-500 tracking-wider">
                DEAL BREAKER!
              </h1>
            </motion.div>

            {/* Player Names */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-2xl text-white mb-8 text-center"
            >
              <span className="text-red-400 font-bold">{playerName}</span>
              <span className="mx-2">stole</span>
              <span className="text-red-400 font-bold">{targetName}'s</span>
              <span className="mx-2">complete</span>
              <span className="font-bold" style={{ color: colorStyle.bg }}>{color}</span>
              <span className="mx-2">set!</span>
            </motion.div>

            {/* Property Set Display */}
            <motion.div
              className="flex justify-center items-center"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <div className="flex -space-x-20 relative">
                {propertySet.map((card, index) => (
                  <motion.div
                    key={card.id}
                    className="relative"
                    style={{ zIndex: propertySet.length - index }}
                    initial={{ opacity: 0, x: -50, rotateY: -90 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    transition={{ delay: 1.2 + index * 0.15 }}
                  >
                    <PropertyCard {...card} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DealBreakerOverlay;
