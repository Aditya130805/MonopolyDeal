import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DoubleRentOverlay = ({ isVisible, modalData, onResponse }) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-gradient-to-br from-emerald-500 to-green-600 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 relative overflow-hidden"
        >
          {/* Background Pattern */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.5, 0.75, 0.5],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
            }}
            className="absolute inset-0 flex flex-wrap justify-around items-center pointer-events-none"
            style={{ zIndex: 0 }}
          >
            {'💵 💸 💰 '.repeat(10).split(' ').map((emoji, i) => (
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
                className="opacity-20 text-2xl"
              >
                {emoji}
              </motion.span>
            ))}
          </motion.div>

          {/* 2x Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              duration: 0.8,
              delay: 0.2,
              bounce: 0.5
            }}
            className="absolute -top-4 -right-4 bg-yellow-400 text-green-600 w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl shadow-lg transform rotate-12"
          >
            2×
          </motion.div>

          {/* Content */}
          <div className="relative z-10">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-6"
            >
              <h2 className="text-3xl font-bold text-white mb-2">Double the Rent?</h2>
              <div className="flex items-center justify-center space-x-2">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-white opacity-90"
                >
                  ${modalData.doubleRentAmount/2}
                </motion.div>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-3xl text-white"
                >
                  →
                </motion.div>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-4xl font-bold text-yellow-300"
                >
                  ${modalData.doubleRentAmount}
                </motion.div>
              </div>
            </motion.div>

            {/* Buttons */}
            <div className="flex justify-center space-x-4">
              <motion.button
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ 
                  duration: 0.3,
                  delay: 0.7,
                  ease: "easeOut"
                }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                onClick={() => onResponse(false)}
                className="px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl font-semibold transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Keep Original
              </motion.button>
              <motion.button
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ 
                  duration: 0.3,
                  delay: 0.8,
                  ease: "easeOut"
                }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                onClick={() => onResponse(true)}
                className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-green-700 rounded-xl font-semibold transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Double It!
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DoubleRentOverlay;
