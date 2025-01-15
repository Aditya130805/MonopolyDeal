import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ActionAnimation = ({ action, isVisible, onComplete }) => {
  const getAnimationContent = (action) => {
    switch (action) {
      
      case 'Rent Request':
        return (
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
                background: 'linear-gradient(45deg, #4CAF50, #66BB6A, #81C784)',
                padding: '40px 60px',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(76, 175, 80, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Background money symbols */}
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
                {'💵 💸 💰 '.repeat(5).split(' ').map((emoji, i) => (
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

              {/* Main Icon */}
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
                style={{
                  fontSize: '72px',
                  fontWeight: '800',
                  color: 'white',
                  textAlign: 'center',
                  textShadow: '3px 3px 0px rgba(0,0,0,0.2)',
                  marginBottom: '15px',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                🏠
              </motion.div>

              {/* Text */}
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
                style={{
                  fontSize: '32px',
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: '600',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                Collect Rent!
              </motion.div>

              {/* Subtitle */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ 
                  y: 0,
                  opacity: 1,
                }}
                transition={{
                  duration: 0.6,
                  ease: [0.34, 1.56, 0.64, 1],
                  delay: 0.3
                }}
                style={{
                  fontSize: '18px',
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: '500',
                  marginTop: '10px',
                  textShadow: '1px 1px 0px rgba(0,0,0,0.1)',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                Time to stack up! 🎯
              </motion.div>
            </motion.div>
          </div>
        );

      case 'Birthday Request':
        return (
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
                background: 'linear-gradient(45deg, #FF6B6B, #FF8E8E, #FFB4B4)',
                padding: '40px 60px',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(255, 107, 107, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ 
                  y: 0,
                  opacity: 1,
                  scale: 1
                }}
                transition={{
                  duration: 0.8,
                  ease: [0.34, 1.56, 0.64, 1],
                  delay: 0.1
                }}
                style={{
                  fontSize: '72px',
                  fontWeight: '800',
                  color: 'white',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  textShadow: '3px 3px 0px rgba(0,0,0,0.2)',
                  letterSpacing: '4px',
                  marginBottom: '15px',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                🎂
              </motion.div>

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
                style={{
                  fontSize: '32px',
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: '600',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                It's Your Birthday!
              </motion.div>
            </motion.div>
          </div>
        );

      case 'pass_go':
        return (
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
                background: 'linear-gradient(45deg, #9B59B6, #8E44AD, #5B2C6F)',
                padding: '40px 60px',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(138, 77, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Decorative wheel */}
              <motion.div
                animate={{
                  rotate: 360
                }}
                transition={{
                  rotate: {
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear"
                  }
                }}
                style={{
                  position: 'absolute',
                  width: '270px',
                  height: '270px',
                  borderRadius: '50%',
                  border: '2px dashed rgba(255,255,255,0.2)',
                  left: '50%',
                  bottom: '-135px',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 100
                }}
              />
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ 
                  y: 0,
                  opacity: 1,
                  scale: 1
                }}
                transition={{
                  duration: 0.8,
                  ease: [0.34, 1.56, 0.64, 1],
                  delay: 0.1
                }}
                style={{
                  fontSize: '72px',
                  fontWeight: '800',
                  color: 'white',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  textShadow: '3px 3px 0px rgba(0,0,0,0.2)',
                  letterSpacing: '4px',
                  marginBottom: '15px',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                Pass Go!
              </motion.div>

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
                style={{
                  fontSize: '32px',
                  color: '#FFD700',
                  textAlign: 'center',
                  fontWeight: '600',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                Draw 2 Cards
              </motion.div>
            </motion.div>
          </div>
        );
      
      case 'Debt Request':
        return (
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
                background: 'linear-gradient(45deg, #E74C3C, #C0392B, #922B21)',
                padding: '40px 60px',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(231, 76, 60, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Decorative coins falling animation */}
              <motion.div
                animate={{
                  y: [0, 100],
                  opacity: [1, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                  ease: "linear"
                }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  left: 0,
                  top: 0,
                  display: 'flex',
                  justifyContent: 'space-around',
                  zIndex: 0
                }}
              >
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      color: '#FFD700',
                      fontSize: '24px',
                      opacity: 0.3,
                      transform: `translateY(${i * 20}px)`
                    }}
                  >
                    💰
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ 
                  y: 0,
                  opacity: 1,
                  scale: 1
                }}
                transition={{
                  duration: 0.8,
                  ease: [0.34, 1.56, 0.64, 1],
                  delay: 0.1
                }}
                style={{
                  fontSize: '72px',
                  fontWeight: '800',
                  color: 'white',
                  textAlign: 'center',
                  textShadow: '3px 3px 0px rgba(0,0,0,0.2)',
                  letterSpacing: '4px',
                  marginBottom: '15px',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                💼
              </motion.div>

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
                style={{
                  fontSize: '32px',
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: '600',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                Collect Your Debt!
              </motion.div>
            </motion.div>
          </div>
        );
      
      default:
        return null;
    
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => {
            if (!isVisible && onComplete) {
              onComplete();
            }
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
          }}
        >
          {getAnimationContent(action)}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActionAnimation;
