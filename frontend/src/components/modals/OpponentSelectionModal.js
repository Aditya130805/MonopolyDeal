import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { useGameState } from '../../contexts/GameStateContext';

const OpponentSelectionModal = ({ isVisible, gameState, opponentIds, type, onSelect, onCancel }) => {
    // const { gameState } = useGameState();
    if (!isVisible) return null;

    const isDebtCollector = type === 'debt_collector';
    const gradientColors = isDebtCollector
        ? 'from-[#E74C3C] via-[#C0392B] to-[#922B21]'
        : 'from-[#4CAF50] via-[#66BB6A] to-[#81C784]';
    
    const shadowColor = isDebtCollector
        ? 'rgba(231, 76, 60, 0.3)'
        : 'rgba(76, 175, 80, 0.3)';
    
    const emoji = isDebtCollector ? '💰' : '🏠';
    const title = isDebtCollector ? 'Select Player for Debt Collection' : 'Select a player to charge rent!';
    const subtitle = 'Choose your target!';
    const backgroundEmojis = isDebtCollector ? '💸 ⚡️ 💰' : '🏠 💵 🏢';

    return (
        <AnimatePresence mode="wait" onExitComplete={onCancel}>
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
            className={`bg-gradient-to-br ${gradientColors} p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 relative overflow-hidden`}
            style={{
                boxShadow: `0 10px 30px ${shadowColor}`,
            }}
            >
            {/* Background Pattern */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ 
                opacity: [0.15, 0.25, 0.1],
                }}
                transition={{
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity,
                }}
                className="absolute inset-0 flex flex-wrap justify-around items-center pointer-events-none"
                style={{ zIndex: 0 }}
            >
                {backgroundEmojis.repeat(10).split(' ').map((emoji, i) => (
                <motion.span
                    key={`${emoji}-${i}-${Date.now()}`}
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

            {/* Content */}
            <div className="relative z-10">
                <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-6"
                >
                <motion.div 
                    className="text-6xl mb-4"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {emoji}
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
                <p className="text-white text-lg">{subtitle}</p>
                </motion.div>

                <div className="space-y-3">
                {opponentIds.map((opponentId, index) => {
                    const opponent = gameState.players.find(p => p.id === opponentId);
                    return (
                    <motion.button
                        key={opponentId}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        onClick={() => onSelect(opponentId)}
                        className="w-full py-3 px-6 bg-white/10 hover:bg-white/20
                                text-white font-semibold text-lg rounded-xl transition-all transform hover:scale-105
                                hover:shadow-lg active:scale-95 backdrop-blur-sm"
                        style={{
                        textShadow: '1px 1px 0px rgba(0,0,0,0.1)',
                        }}
                    >
                        {opponent?.name || `Player ${opponentId}`}
                    </motion.button>
                    );
                })}
                </div>

                <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={onCancel}
                className="mt-6 w-full py-3 px-6 bg-black/20 hover:bg-black/30
                        text-white/80 font-medium rounded-xl transition-all transform hover:scale-105
                        hover:shadow-lg active:scale-95 backdrop-blur-sm"
                >
                Cancel
                </motion.button>
            </div>
            </motion.div>
        </motion.div>
        </AnimatePresence>
    );
};

export default OpponentSelectionModal;
