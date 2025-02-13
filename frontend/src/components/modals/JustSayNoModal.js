import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ActionCard from '../cards/ActionCard';
import PropertyCard from '../cards/PropertyCard';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useGameState } from '../../contexts/GameStateContext';

const JustSayNoModal = ({ isOpen, onClose, modalData, roomId }) => {
  const { socket } = useWebSocket();
  const { gameState, setGameState } = useGameState();
  const player = gameState.players.find(p => p.id === modalData.playerId);
  const opponent = gameState.players.find(p => p.id === modalData.opponentId);

  const handleResponse = (wantsToPlayJustSayNo) => {
    if (socket) {
      socket.send(JSON.stringify({
        action: 'just_say_no_response',
        play_just_say_no: wantsToPlayJustSayNo,
        playing_player: modalData.playerId,
        against_player: modalData.opponentId,
        playing_player_name: player.name,
        against_player_name: opponent.name,
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
            className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-xl shadow-2xl p-8 mx-4 relative overflow-hidden"
            style={{ width: modalData.againstCard?.name === 'Deal Breaker' ? '900px' : '600px' }}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-6"
            >
              <h2 className="text-3xl font-bold text-white mb-2">Just Say No?</h2>
              <p className="text-purple-100 text-lg">
                {opponent.name} has played an action against you! Counter it?
              </p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`flex justify-center items-start ${modalData.againstCard?.name === 'Deal Breaker' ? 'space-x-24' : 'space-x-5'} mb-8`}
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

              {modalData.againstCard?.name === 'Deal Breaker' && modalData.data && (
                <div className="flex flex-col items-start">
                  <div className="flex" style={{ marginLeft: '-80px' }}>
                    {modalData.data.target_set.map((card, index) => (
                      <div 
                        key={index} 
                        style={{ marginLeft: index === 0 ? '0' : '-80px' }}
                      >
                        {card.type === 'action' && (
                          <ActionCard {...card} />
                        )}
                        {card.type === 'property' && (
                          <PropertyCard {...card} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(modalData.againstCard?.name === 'Rent' || 
                modalData.againstCard?.name === 'Multicolor Rent' || 
                modalData.againstCard?.name === 'Double The Rent') && modalData.data && (
                <div className="flex flex-col items-start">
                  <div className="flex items-center">
                    <div className="bg-purple-700/50 rounded-xl px-6 py-4 border border-purple-300/30">
                      <div className="text-purple-100 text-lg font-semibold">
                        Rent Amount:
                      </div>
                      <div className="text-white text-4xl font-bold mt-1">
                        ${modalData.data.rentAmount}M
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalData.againstCard?.name === 'Sly Deal' && modalData.data && (
                <div className="flex flex-col items-start">
                  <div>
                    <PropertyCard {...modalData.data.target_property} />
                  </div>
                </div>
              )}

              {modalData.againstCard?.name === 'Forced Deal' && modalData.data && (
                <div className="flex flex-col items-start">
                  <div className="flex items-end">
                    <div className="flex flex-col">
                      <div className="text-purple-100 text-sm mb-1 text-center">They want</div>
                      <PropertyCard {...modalData.data.target_property} />
                    </div>
                    <div className="text-purple-100 text-2xl mx-3 mb-[110px]">⇄</div>
                    <div className="flex flex-col">
                      <div className="text-purple-100 text-sm mb-1 text-center">You receive</div>
                      <PropertyCard {...modalData.data.user_property} />
                    </div>
                  </div>
                </div>
              )}
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
