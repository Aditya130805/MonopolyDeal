import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ActionCard from '../cards/ActionCard';
import { useWebSocket } from '../../contexts/WebSocketContext';

const JustSayNoModal = ({ isOpen, onClose, modalData, roomId }) => {
  const { socket } = useWebSocket();

  const handleResponse = (wantsToPlayJustSayNo) => {
    if (socket) {
      socket.send(JSON.stringify({
        action: 'just_say_no_response',
        play_just_say_no: wantsToPlayJustSayNo,
        playing_player: modalData.playingPlayer,
        against_player: modalData.againstPlayer,
        playing_player_name: modalData.playingPlayerName,
        against_player_name: modalData.againstPlayerName,
        card: modalData.card,
        against_card: modalData.againstCard,
        against_rent_card: modalData.againstRentCard,
        data: JSON.stringify(modalData.data)
      }));
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-[9999] flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 relative overflow-hidden"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-6"
            >
              <h2 className="text-3xl font-bold text-white mb-2">Just Say No?</h2>
              <p className="text-purple-100 text-lg">
                {modalData.againstPlayerName} has played an action against you! Counter it?
              </p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center mb-8"
            >
              <div className="relative">
                <motion.div
                  animate={{
                    rotate: [0, -5, 5, -5, 0],
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.5,
                    ease: "easeInOut",
                  }}
                  className="transform hover:scale-105 transition-transform duration-200"
                >
                  <ActionCard {...modalData.againstCard} />
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="absolute -top-4 -right-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg"
                >
                  Against You!
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center space-x-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleResponse(false)}
                className="px-6 py-3 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-white transition-colors duration-200"
              >
                Accept Action
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleResponse(true)}
                className="px-6 py-3 bg-white text-purple-700 rounded-lg font-semibold hover:bg-opacity-90 transition-colors duration-200 shadow-lg"
              >
                Play Just Say No!
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JustSayNoModal;
