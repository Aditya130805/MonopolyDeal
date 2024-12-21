import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  UserGroupIcon,
  ArrowLeftIcon,
  UserCircleIcon,
  SparklesIcon,
  ClipboardIcon,
} from '@heroicons/react/24/outline';
import Particles from './Particles';
import Navbar from './auth/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';

const ActiveGameRoom = () => {
  const { roomId } = useParams();
  const [players, setPlayers] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const maxPlayers = 4;
  const requiredPlayers = 2;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, wsLoading } = useWebSocket();

  // Set up socket's message handler
  useEffect(() => {
    if (!socket) {
        console.log("Socket is null; waiting for WebSocket connection.");
        return;
    }
    console.log("Socket connected:", socket);
    socket.onmessage = handleMessage;
  }, [socket, wsLoading]);

  const handleMessage = (event) => {
    try {
      console.log(`WebSocket message in room ${roomId}:`, event.data);
      const data = JSON.parse(event.data);
      if (data.type && data.type === "rejection") {
        navigate("/play");
      } else if (data.type && data.type === "broadcast_game_started") {
        navigate(`/game/${roomId}`);
      }
      if (data.players) {
        setPlayers(data.players);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  const handleLeaveRoom = () => {
    if (socket) socket.close();
    navigate('/play');
  };

  const handleReady = () => {
    setIsReady(!isReady);
    if (socket) {
      socket.send(JSON.stringify({
        action: 'player_ready',
        isReady: !isReady
      }));
    }
  };

  const handleStartGame = () => {
    if (socket) {
      socket.send(JSON.stringify({
        action: 'start_game',
        player_name: user.username
      }));
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const isGameStartDisabled = players.length < requiredPlayers || !players.every(p => p.isReady);

  if (wsLoading || !socket) {
    return (
      <div className="relative min-h-screen w-full bg-gradient-to-br from-gray-50 to-white dark:bg-gray-900">
        <Particles />
        <Navbar />
        <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
          {/* Glass Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-3xl text-center"
          >
            <div className="flex flex-col items-center gap-6">
              {/* Loading Spinner */}
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-black border-opacity-60"></div>
              
              {/* Loading Text */}
              <h2 className="text-2xl font-bold text-gray-800">Loading Room {roomId} ...</h2>
              <p className="text-gray-600 text-sm">
                Please wait while we set up your room. This won't take long!
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

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
              <div className="text-center flex-grow flex items-center justify-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-black flex items-center gap-2 justify-center">
                  <SparklesIcon className="w-6 h-6" />
                  <span className="hidden sm:inline">Room:</span> {roomId}
                </h1>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyToClipboard}
                  className={`flex items-center gap-1 ${copySuccess ? 'text-green-500' : 'text-gray-600'}`}
                  title="Copy Room ID"
                >
                  <ClipboardIcon className="w-6 h-6" />
                </motion.button>
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
              onClick={handleStartGame}
              disabled={isGameStartDisabled}
              className={`px-6 sm:px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 ${
                isGameStartDisabled ? 'bg-gray-200 text-gray-500' : 'bg-black text-white'
              } w-full sm:w-auto`}
            >
              Start Game
            </motion.button>
          </motion.div>

          {/* Information Box */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-4 border-blue-400 bg-blue-50 p-4 rounded-xl mb-8 mt-8 shadow-lg text-center w-full"
          >
              <p className="text-md"><span className="text-lg"><strong>Note: </strong></span>
              To start the game, a minimum of {requiredPlayers} players are required, and all players must be ready.
              </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ActiveGameRoom;
