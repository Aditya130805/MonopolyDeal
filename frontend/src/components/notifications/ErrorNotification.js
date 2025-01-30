import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ErrorNotification = ({ error, setError, index = 0 }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    if (error) {
      setIsVisible(true);
    }
  }, [error]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setError(''), 300);
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(handleClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const bottomPosition = 2 + (index * 4.8);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
          }}
          className="fixed right-4 z-50 flex items-center gap-1 text-red-600 bg-red-50 px-4 rounded-xl shadow-2xl max-w-md border border-red-100"
          style={{ 
            bottom: `${bottomPosition}rem`,
            minHeight: '4rem', 
            padding: '0.75rem 1rem' 
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <p className="text-base font-medium" style={{ lineHeight: '1.2' }}>{error}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ErrorNotification;
