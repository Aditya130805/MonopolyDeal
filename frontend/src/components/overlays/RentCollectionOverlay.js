import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RentCollectionOverlay = ({ isVisible, onClose, overlayData }) => {
  const [animationKey, setAnimationKey] = useState(0);
  
  // // Update animation key when message changes to trigger animation restart
  // useEffect(() => {
  //   if (isVisible && overlayData.message) {
  //     setAnimationKey(prev => prev + 1);
  //   }
  // }, [isVisible, overlayData.message]);

  return (
    <AnimatePresence mode="wait" onExitComplete={onClose}>
      {isVisible && (
        <motion.div
          // key={`rent-collection-overlay-${animationKey}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          {/* Progress Indicator - Middle Ground */}
          {overlayData.currentPaymentIndex !== undefined && overlayData.totalPayments !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="absolute top-5 right-5 z-20 bg-black/40 backdrop-blur-sm border border-yellow-400/30 rounded-lg px-3 py-2 shadow-md flex items-center"
            >
              {/* Progress bar */}
              <div className="relative h-1.5 w-24 bg-gray-600/50 rounded-full mr-3 overflow-hidden">
                <motion.div 
                  className="absolute left-0 top-0 h-full bg-yellow-400"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(overlayData.currentPaymentIndex / overlayData.totalPayments) * 100}%` 
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              
              {/* Fraction text */}
              <span className="text-sm font-medium text-yellow-300">
                {overlayData.currentPaymentIndex}/{overlayData.totalPayments}
              </span>
            </motion.div>
          )}
          
          <div className="text-center relative z-10">
            {/* Animated money icon */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 360, 360]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-16 h-16 mb-4 mx-auto"
            >
              <svg
                className="w-full h-full text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </motion.div>
            
            {/* Message with fade animation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-2"
            >
              <motion.p
                animate={{
                  opacity: [1, 0.7, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
                className="text-white text-xl font-semibold"
              >
                {overlayData.message}
              </motion.p>
              
              {/* Loading dots animation */}
              <motion.div 
                className="flex justify-center space-x-2 mt-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              >
                <motion.div
                  animate={{ 
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity,
                    delay: 0,
                    ease: "easeInOut"
                  }}
                  className="w-2 h-2 bg-yellow-500 rounded-full"
                />
                <motion.div
                  animate={{ 
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity,
                    delay: 0.2,
                    ease: "easeInOut"
                  }}
                  className="w-2 h-2 bg-yellow-500 rounded-full"
                />
                <motion.div
                  animate={{ 
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity,
                    delay: 0.4,
                    ease: "easeInOut"
                  }}
                  className="w-2 h-2 bg-yellow-500 rounded-full"
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RentCollectionOverlay;
