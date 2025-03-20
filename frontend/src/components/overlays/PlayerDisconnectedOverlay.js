import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const PlayerDisconnectedOverlay = ({ isVisible, onClose, overlayData }) => {
    const navigate = useNavigate();
    const username = overlayData?.username || 'A player';

    return (
        <AnimatePresence mode="wait" onExitComplete={() => onClose()}>
        {isVisible && overlayData && (
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
                            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)',
                            boxShadow: '0 10px 30px -8px rgba(0, 0, 0, 0.2)',
                        }}
                    >
                        {/* Warning icon */}
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
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-full h-full">
                            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                            </svg>
                        </motion.div>
                        
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <h2 className="text-3xl font-bold text-white mt-4 mb-2">Player Disconnected!</h2>
                            
                            <p className="text-xl text-white/90 mb-4">
                                <span className="font-semibold text-blue-300">{username}</span> has left the game.
                            </p>
                            
                            <p className="text-white/80 mb-6">
                                The game cannot continue. Please return home. 
                                {/* You will be redirected to the home page in a few seconds. */}
                            </p>
                            
                            {/* Progress bar
                            <div className="w-full bg-white/20 rounded-full h-2 mb-4 overflow-hidden">
                                <motion.div 
                                    className="h-full bg-white"
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: 5, ease: "linear" }}
                                />
                            </div> */}
                            
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 bg-red-800 text-gray-100 font-bold rounded-lg shadow-lg text-lg transform"
                                onClick={() => {
                                    navigate('/');
                                    onClose();
                                }}
                            >
                                Return Home
                            </motion.button>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>
        )}
        </AnimatePresence>
    );
};

export default PlayerDisconnectedOverlay;