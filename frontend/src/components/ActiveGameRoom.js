import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  UserGroupIcon,
  ArrowLeftIcon,
  UserCircleIcon,
  SparklesIcon,
  ClipboardIcon,
  GlobeAltIcon,
  ArrowRightStartOnRectangleIcon,
  UserIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import Particles from './Particles';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useGameState, createEmptyGameState } from '../contexts/GameStateContext';
import ErrorNotification from './notifications/ErrorNotification';

const Button = ({ children, variant = 'default', size = 'md', className = '', onClick, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200';
  const sizeClasses = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-base',
    lg: 'h-14 px-10 text-base'
  };
  const variantClasses = {
    default: 'bg-black text-white hover:bg-gray-900 shadow-lg hover:shadow-xl',
    outline: 'bg-transparent border-2 border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100'
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const ActiveGameRoom = () => {
  const { roomId } = useParams();
  const [players, setPlayers] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [errors, setErrors] = useState([]);
  const maxPlayers = 4;
  const requiredPlayers = 2;
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const { socket, wsLoading } = useWebSocket();
  const { setGameState } = useGameState();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set up socket's message handler
  useEffect(() => {
    if (!socket) {
        console.log("Socket is null; waiting for WebSocket connection.");
        return;
    }
    console.log("Socket connected:", socket);
    socket.onmessage = handleMessage;

    // Reset game state when entering the room to prevent previous victory overlay
    // from showing when starting a new game with the same group
    setGameState(createEmptyGameState());
  }, [socket, wsLoading, setGameState]);

  const handleMessage = (event) => {
    try {
      // console.log(`WebSocket message in room ${roomId}:`, event.data);
      const data = JSON.parse(event.data);
      if (data.type && data.type === "rejection") {
        navigate('/');
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
    navigate('/');
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
      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
        <Particles />
        {/* Subtle Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-100/30 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100/20 via-transparent to-transparent" />
        
        {/* Floating Navigation */}
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center">
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-[90%] max-w-5xl"
          >
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl px-6 py-3 shadow-2xl">
              <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                  <div className="bg-black p-2 rounded-lg">
                    <GlobeAltIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">Cardopoly</span>
                </Link>
              </div>
            </div>
          </motion.nav>
        </div>

        <div className="relative pt-32 pb-20">
          <div className="max-w-6xl mx-auto px-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl p-12 w-full max-w-3xl text-center"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-gray-900 border-opacity-60"></div>
                <h2 className="text-3xl md:text-4xl font-serif text-gray-900 leading-tight">Loading Room {roomId} ...</h2>
                <p className="text-lg text-gray-600">
                  Please wait while we set up your room. This won't take long!
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <Particles />
      {/* Subtle Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-100/30 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100/20 via-transparent to-transparent" />
      
      {/* Floating Navigation */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center">
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-[90%] max-w-5xl"
        >
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl px-6 py-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <div className="bg-black p-2 rounded-lg">
                  <GlobeAltIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Cardopoly</span>
              </Link>
              
              <div className="flex items-center gap-3">
                {!loading && (
                  <>
                    {user ? (
                      <>
                        <div className="relative" ref={dropdownRef}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-black hover:bg-gray-800 transition-colors"
                          >
                            <UserIcon className="w-5 h-5 text-white" />
                          </motion.button>
                          {dropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50"
                            >
                              <Link to="/settings" onClick={() => setDropdownOpen(false)}>
                                <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                                  <Cog6ToothIcon className="w-5 h-5 text-gray-700" />
                                  <span className="text-sm font-medium text-gray-900">Settings</span>
                                </div>
                              </Link>
                              <div 
                                onClick={() => {
                                  setDropdownOpen(false);
                                  logout();
                                }}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors cursor-pointer border-t border-gray-200"
                              >
                                <ArrowRightStartOnRectangleIcon className="w-5 h-5 text-red-600" />
                                <span className="text-sm font-medium text-red-600">Logout</span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </>
                    ) : (
                      <Link to="/login">
                        <Button size="sm" className="rounded-full">
                          Get Started
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.nav>
      </div>

      <div className="relative pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl p-8 mb-8"
          >
            <div className="flex justify-between items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLeaveRoom}
                className="flex items-center gap-2"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Leave Room</span>
              </Button>
              <div className="text-center flex-grow flex items-center justify-center gap-3">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-gray-900 leading-tight flex items-center gap-3 justify-center">
                  <SparklesIcon className="w-8 h-8 text-gray-800" />
                  <span className="hidden sm:inline">Room:</span> {roomId}
                </h1>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyToClipboard}
                  className={`flex items-center gap-1 transition-colors ${copySuccess ? 'text-green-600' : 'text-gray-600 hover:text-gray-900'}`}
                  title="Copy Room ID"
                >
                  <ClipboardIcon className="w-6 h-6" />
                </motion.button>
              </div>
              <div className="w-[52px] sm:w-20"></div>
            </div>
          </motion.div>

          {/* Error Notifications */}
          {errors.slice().reverse().map((error, index) => (
            <ErrorNotification
              key={error.id}
              error={error.message}
              setError={() => {
                setErrors(prev => prev.filter(e => e.id !== error.id));
              }}
              index={index}
            />
          ))}

          {/* Players Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl p-8 mb-8"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="bg-black p-2 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Players</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Existing Players */}
              <AnimatePresence>
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 transform transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <UserCircleIcon className="w-8 h-8 text-gray-800" />
                      <div>
                        <span className="text-lg font-bold text-gray-900">{player.name}</span>
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
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
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
                    className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center bg-gray-50/50"
                  >
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-gray-500 text-base flex items-center gap-2"
                    >
                      <UserCircleIcon className="w-5 h-5" />
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
            className="flex flex-col sm:flex-row justify-center gap-6 mb-8"
          >
            <Button
              onClick={handleReady}
              variant={isReady ? "outline" : "default"}
              size="lg"
              className={`rounded-full h-14 px-10 ${isReady ? 'border-2 border-gray-900' : ''}`}
            >
              {isReady ? 'Not Ready' : 'Ready'}
            </Button>

            <Button
              onClick={handleStartGame}
              disabled={isGameStartDisabled}
              size="lg"
              className={`rounded-full h-14 px-10 ${
                isGameStartDisabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''
              }`}
            >
              Start Game
            </Button>
          </motion.div>

          {/* Information Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl p-8 text-center"
          >
            <p className="text-lg text-gray-600 leading-relaxed">
              <span className="text-xl font-serif text-gray-900 font-bold">Note: </span>
              To start the game, a minimum of {requiredPlayers} players are required, and all players must be ready.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ActiveGameRoom;
