import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  UserGroupIcon,
  ArrowLeftIcon,
  UserCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Particles from './Particles';
import Navbar from './auth/Navbar';
import { useAuth } from '../contexts/AuthContext';

const ActiveGameRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const maxPlayers = 4;
  const requiredPlayers = 2;
  const wsRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket(`ws://localhost:8000/ws/game/${roomId}/`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket Connected');
      ws.send(JSON.stringify({ action: 'establish_connection', player_id: user.unique_id }));
      console.log('Player Connected');
      setIsLoading(false);
    };

    ws.onmessage = (event) => {
      // console.log('WebSocket Message:', event.data);
      const data = JSON.parse(event.data);
      // console.log(data);
      if (data.type && data.type === "rejection") {
        navigate("/play");
      }
      if (data.players) {
        setPlayers(data.players);
      }
    };

    ws.onerror = (error) => {
      // console.log('WebSocket error:', error);
      setIsLoading(false);
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
    };

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId, navigate]);

  const handleLeaveRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    navigate('/play');
  };

  const handleReady = () => {
    setIsReady(!isReady);
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        action: 'player_ready',
        isReady: !isReady
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen w-full bg-gray-50 dark:bg-gray-900">
        <Particles />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading game room...</p>
        </div>
      </div>
    );
  }

  const isGameStartDisabled = players.length < requiredPlayers || !players.every(p => p.isReady);

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-gray-50 to-white dark:bg-gray-900">
      <Particles />
      <Navbar />
      <div className="relative z-10">
        {/* Glass Container */}
        <div className="max-w-6xl mx-auto p-4 sm:p-6 relative z-10">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-4 sm:p-6 mb-8"
          >
            <div className="flex justify-between items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLeaveRoom}
                className="flex items-center gap-2 text-gray-800 hover:text-black"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Leave Room</span>
              </motion.button>
              <div className="text-center flex-grow">
                <h1 className="text-2xl sm:text-3xl font-bold text-black flex items-center gap-2 justify-center">
                  <SparklesIcon className="w-6 h-6" />
                  <span className="hidden sm:inline">Room:</span> {roomId}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {players.length}/{maxPlayers} Players
                </p>
              </div>
              <div className="w-[52px] sm:w-20"></div>
            </div>
          </motion.div>

          {/* Players Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-4 sm:p-6 mb-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <UserGroupIcon className="w-6 h-6 text-gray-800" />
              <h2 className="text-xl sm:text-2xl font-bold text-black">Players</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Existing Players */}
              <AnimatePresence>
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="bg-black/5 backdrop-blur-md rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3 transform transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <UserCircleIcon className="w-8 sm:w-10 h-8 sm:h-10 text-gray-800" />
                      <div>
                        <span className="font-bold text-gray-900">{player.name}</span>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xs text-gray-600 text-left"
                        >
                          Online
                        </motion.div>
                      </div>
                    </div>
                    <motion.div
                      animate={{
                        scale: player.isReady ? [1, 1.1, 1] : 1,
                      }}
                      transition={{ duration: 0.5 }}
                      className={`px-4 py-2 rounded-full text-sm ${
                        player.isReady ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {player.isReady ? 'Ready!' : 'Not Ready'}
                    </motion.div>
                  </div>
                ))}

                {/* Empty Slots */}
                {Array.from({ length: maxPlayers - players.length }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 flex items-center justify-center bg-white/30 backdrop-blur-sm"
                  >
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-gray-500 flex items-center gap-2"
                    >
                      <UserCircleIcon className="w-6 h-6" />
                      Waiting for player...
                    </motion.span>
                  </div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Game Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReady}
              className={`px-6 sm:px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 w-full sm:w-auto ${
                isReady
                  ? 'bg-white text-black border-2 border-black'
                  : 'bg-black text-white'
              }`}
            >
              {isReady ? 'Not Ready' : 'Ready'}
            </motion.button>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={!isGameStartDisabled ? { scale: 1.05 } : {}}
              whileTap={{ scale: 0.95 }}
              disabled={isGameStartDisabled}
              className={`px-6 sm:px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 ${
                isGameStartDisabled ? 'bg-gray-200 text-gray-500' : 'bg-black text-white'
              } w-full sm:w-auto`}
            >
              Start Game
            </motion.button>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ActiveGameRoom;
