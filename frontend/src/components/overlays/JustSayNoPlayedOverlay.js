import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ActionCard from '../cards/ActionCard';
import { useGameState } from '../../contexts/GameStateContext';

const JustSayNoPlayedOverlay = ({ isVisible, onClose, overlayData }) => {
  const { gameState } = useGameState();
  
  const playingPlayerId = overlayData?.playingPlayerId;
  const againstPlayerId = overlayData?.againstPlayerId;
  const actionCard = overlayData?.actionCard;
  const justSayNoCard = overlayData?.justSayNoCard;
  
  const player = gameState.players.find(p => p.id === playingPlayerId);
  const opponent = gameState.players.find(p => p.id === againstPlayerId);
  const playingPlayerName = player?.name;
  const againstPlayerName = opponent?.name;

  return (
    <AnimatePresence mode="wait" onExitComplete={onClose}>
      {isVisible && overlayData && player && opponent && actionCard && justSayNoCard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-purple-600 to-purple-800 p-8 rounded-lg shadow-xl text-white text-center max-w-md mx-4"
          >
            <h2 className="text-2xl font-bold mb-4 text-white">Just Say No!</h2>
            <p className="text-lg mb-6">
              {playingPlayerName} played a Just Say No card to block {againstPlayerName}'s action!
            </p>
            <div className="flex justify-center items-center gap-8">
              <div className="relative">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="text-6xl z-10">🚫</span>
                </motion.div>
                <div className="opacity-50">
                  <ActionCard {...actionCard} />
                </div>
              </div>
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <ActionCard {...justSayNoCard} />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JustSayNoPlayedOverlay;
