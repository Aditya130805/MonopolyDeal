import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const WinnerOverlay = ({ isVisible, onClose, overlayData }) => {
  const navigate = useNavigate();
  const winner = overlayData?.winner;

  return (
    <AnimatePresence mode="wait" onExitComplete={onClose}>
      {isVisible && overlayData && winner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-center justify-center z-[9999]"
        >
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          <div style={{ position: 'relative' }}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: 1,
                opacity: 1,
              }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="relative rounded-xl shadow-2xl p-8 mx-4 max-w-lg w-full text-center overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.9) 0%, rgba(255, 165, 0, 0.9) 100%)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 50px rgba(255, 215, 0, 0.3)',
              }}
            >
              {/* Crown icon */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-32 h-32 mx-auto mb-0"
              >
                <span className="text-7xl">👑</span>
              </motion.div>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="text-4xl font-bold -mt-4 mb-6 text-yellow-900"
              >
                Victory! 🥳
              </motion.h2>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="bg-yellow-900/10 backdrop-blur-sm rounded-lg p-6 mb-6"
              >
                <p className="text-2xl text-yellow-900">
                  <span className="font-bold">{winner}</span>
                </p>
                <p className="text-xl text-yellow-800 mt-2">
                  Master of Cardopoly!
                </p>
              </motion.div>

              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(120, 53, 15, 0.95)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="bg-yellow-900/75 hover:bg-yellow-900/85 text-yellow-100 font-bold py-3 px-6 rounded-lg text-lg shadow-lg transform"
                // transition-all duration-200
                style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}
              >
                Return Home
              </motion.button>

              {/* Decorative glow */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WinnerOverlay;
