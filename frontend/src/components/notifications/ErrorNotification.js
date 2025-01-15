import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ErrorNotification = ({ error, setError }) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (error) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        setError('');
      }, 3000);
    }
    
    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [error, setError]);

  return (
    <AnimatePresence>
      {error && (
        <motion.div 
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ 
            type: "spring",
            stiffness: 100,
            damping: 15,
            mass: 1
          }}
          className="fixed bottom-8 right-4 z-50 flex items-center gap-4 text-red-600 bg-red-50 px-6 py-4 rounded-xl shadow-2xl max-w-md border border-red-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 flex-shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <p className="text-base font-medium">{error}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ErrorNotification;
