import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createRoom, joinRoom } from '../services/gameService';
import {
  ArrowLeftIcon,
  ClipboardDocumentIcon,
  UserGroupIcon,
  PlusCircleIcon,
  ArrowRightCircleIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  HomeIcon,
  GlobeAltIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

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

const GameRoom = () => {
  const { user, loading, logout } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const [error, setError] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const { roomId } = useParams();

  const handleUpdate = useCallback((data) => {
    // console.log("Received WebSocket data:", data);
    if (data.type === 'rejection') {
      setError(data.message);
      navigate('/');
      return;
    }
    setRoomData(data);
  }, [navigate]);

  const fetchRoomData = useCallback(async () => {
    if (!roomId) return;
    try {
      const response = await getRoom(roomId);
      if (response.error) {
        setError(response.error);
        navigate('/');
        return;
      }
      setRoomData(response);
    } catch (error) {
      console.error('Error fetching room:', error);
      setError(error.message || 'Failed to fetch room data');
      navigate('/');
    }
  }, [roomId, navigate]);

  useEffect(() => {
    if (roomId) {
      fetchRoomData();
    }
  }, [roomId, fetchRoomData]);

  const generateRoomCode = async () => {
    try {
      setError('');  // Clear any previous errors
      const response = await createRoom();
      if (response.status === 'success') {
        setRoomCode(response.room_id);
        setIsCreator(true);  // Set isCreator to true when creating a room
        navigate(`/room/${response.room_id}`);
      } else {
        setError(response.message || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error in generateRoomCode:', error);
      setError(error.message || 'Error creating room. Please try again.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleJoinRoom = async () => {
    try {
      setError('');  // Clear any previous errors
      if (!joinCode) {
        setError('Please enter a room code');
        return;
      }
      const response = await joinRoom(joinCode);
      if (response.status === 'success') {
        navigate(`/room/${joinCode}`);
      } else {
        setError(response.message || 'Room not found');
      }
    } catch (error) {
      console.error('Error in handleJoinRoom:', error);
      setError(error.message || 'Error joining room. Please try again.');
    }
  };

  // Decorative background elements
  const decorativeElements = Array(6).fill(null).map((_, i) => (
    <motion.div
      key={i}
      className="absolute hidden md:block"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 0.1,
        scale: 1,
        rotate: Math.random() * 360,
      }}
      transition={{ 
        duration: 20,
        repeat: Infinity,
        repeatType: "reverse",
        delay: i * 0.5
      }}
      style={{
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        width: `${Math.random() * 100 + 50}px`,
        height: `${Math.random() * 100 + 50}px`,
        background: `linear-gradient(45deg, rgba(0,0,0,${Math.random() * 0.1}), rgba(0,0,0,${Math.random() * 0.1}))`,
        borderRadius: '40%',
        filter: 'blur(50px)',
        zIndex: 0
      }}
    />
  ));

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      {decorativeElements}
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
                      <>
                        <Link to="/login">
                          <Button variant="ghost" size="sm">
                            Log In
                          </Button>
                        </Link>
                        <Link to="/register">
                          <Button size="sm" className="rounded-full">
                            Get Started
                          </Button>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.nav>
      </div>

      <div className="relative pt-32 pb-20">
        
        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-gray-900 mb-6 leading-tight">
              Game Room
            </h1>
            <p className="text-lg md:text-xl text-gray-600 font-light">
              Ready to build your empire?
            </p>
          </motion.div>

          {/* Game Room Features */}
          <div className="grid md:grid-cols-2 gap-8 relative">
            {/* Create Room Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="bg-black p-2 rounded-lg">
                  <PlusCircleIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Create Room
                </h2>
              </div>

              <p className="text-base text-gray-600 mb-6 leading-relaxed">
                Start your own property empire and invite friends to join.
              </p>

              <div className="space-y-4">
                <Button
                  onClick={generateRoomCode}
                  size="md"
                  className="w-full rounded-full flex items-center justify-center gap-2"
                >
                  <PlusCircleIcon className="w-5 h-5" />
                  Generate Room Code
                </Button>

                {roomCode && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 p-6 rounded-2xl border border-gray-200"
                  >
                    <p className="text-sm text-gray-600 font-medium mb-3">Your Room Code:</p>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-3xl font-mono font-bold text-gray-900">{roomCode}</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={copyToClipboard}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <ClipboardDocumentIcon className="w-6 h-6" />
                      </motion.button>
                    </div>
                    {showCopied && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-gray-600 mt-3"
                      >
                        Room code copied!
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Join Room Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="bg-black p-2 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Join Room
                </h2>
              </div>

              <p className="text-base text-gray-600 mb-6 leading-relaxed">
                Join your friends' game room and compete for properties!
              </p>

              <div className="space-y-4">
                <input
                  type="text"
                  id="roomCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter room code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors uppercase font-mono text-base"
                  maxLength={6}
                />

                <Button
                  onClick={handleJoinRoom}
                  size="md"
                  className="w-full rounded-full flex items-center justify-center gap-2"
                >
                  Join Game
                  <ArrowRightCircleIcon className="w-5 h-5" />
                </Button>
                {error && (
                  <p className="text-sm text-red-600 mt-2">{error}</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Room Information */}
          {roomData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-3xl md:text-4xl font-serif text-gray-900 mb-6 leading-tight">Room Information</h3>
              <div className="space-y-4 text-lg text-gray-600">
                <p className="flex items-center gap-3">
                  <UserGroupIcon className="w-6 h-6 text-gray-800" />
                  Players: {roomData.player_count} / {roomData.max_players}
                </p>
                <p className="flex items-center gap-3">
                  <HomeIcon className="w-6 h-6 text-gray-800" />
                  Room ID: {roomData.room_id}
                </p>
                <p className="flex items-center gap-3">
                  <BuildingOffice2Icon className="w-6 h-6 text-gray-800" />
                  Status: {roomData.has_started ? 'Active' : 'Waiting for players'}
                </p>
              </div>
            </motion.div>
          )}

          {/* Quick Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl"
          >
            <h3 className="text-3xl md:text-4xl font-serif text-gray-900 mb-8 text-center leading-tight">
              Quick Tips
            </h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4 text-lg text-gray-600">
                <p className="flex items-center gap-3">
                  <BanknotesIcon className="w-6 h-6 text-gray-800 flex-shrink-0" />
                  Share the room code with your friends
                </p>
                <p className="flex items-center gap-3">
                  <UserGroupIcon className="w-6 h-6 text-gray-800 flex-shrink-0" />
                  Play with 2-4 players in a room
                </p>
              </div>
              <div className="space-y-4 text-lg text-gray-600">
                <p className="flex items-center gap-3">
                  <BuildingOffice2Icon className="w-6 h-6 text-gray-800 flex-shrink-0" />
                  Keep your room code private
                </p>
                <p className="flex items-center gap-3">
                  <HomeIcon className="w-6 h-6 text-gray-800 flex-shrink-0" />
                  Wait for all players before starting
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
