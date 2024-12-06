import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createRoom, getRoom, connectToGameRoom, disconnectFromGameRoom } from '../services/gameService';
import {
  ArrowLeftIcon,
  ClipboardDocumentIcon,
  UserGroupIcon,
  PlusCircleIcon,
  ArrowRightCircleIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  HomeIcon,
} from '@heroicons/react/24/outline';

const GameRoom = () => {
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const [error, setError] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const navigate = useNavigate();
  const { roomId } = useParams();

  const handleUpdate = useCallback((data) => {
    console.log("Received WebSocket data:", data);
    if (data.type === 'rejection') {
      console.log("REJECTED 2!");
      setError(data.message);
      navigate('/play');
      return;
    }
    setRoomData(data);
  }, [navigate]);

  useEffect(() => {
    if (roomId) {
      console.log('Fetching room data...');
      fetchRoomData();
      // Set up WebSocket connection
      connectToGameRoom(roomId, handleUpdate, isCreator);

      // Cleanup WebSocket connection on unmount
      return () => {
        disconnectFromGameRoom();
      };
    }
  }, [roomId, isCreator, handleUpdate]);

  const fetchRoomData = async () => {
    try {
      const response = await getRoom(roomId);
      if (response.error) {
        setError(response.error);
        navigate('/play');
        return;
      }
      setRoomData(response);
    } catch (error) {
      console.error('Error fetching room:', error);
      setError(error.message || 'Failed to fetch room data');
      navigate('/play');
    }
  };

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
      const response = await getRoom(joinCode);
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
    <div className="relative min-h-screen w-full bg-gradient-to-br from-gray-50 to-white dark:bg-gray-900">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 relative overflow-hidden">
        {decorativeElements}
        
        {/* Main Content */}
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header with Back Button */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-12 gap-4">
            <Link to="/" className="self-start sm:self-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-gray-800 hover:text-black font-medium"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Home
              </motion.button>
            </Link>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-2">
                Game Room
              </h1>
              <div className="flex items-center justify-center gap-2 text-sm sm:text-base text-gray-600">
                <BanknotesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Ready to build your empire?</span>
              </div>
            </motion.div>
            <div className="w-24 hidden sm:block"></div> {/* Spacer for alignment */}
          </div>

          {/* Game Room Features */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-8 relative">
            {/* Create Room Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 border border-gray-200 relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <PlusCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-800" />
                <h2 className="text-xl sm:text-2xl font-bold text-black">
                  Create Room
                </h2>
              </div>

              <div className="flex items-center gap-2 mb-6 sm:mb-8 text-gray-600">
                <BuildingOffice2Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <p className="text-sm sm:text-base">Start your own property empire and invite friends to join.</p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateRoomCode}
                  className="w-full bg-black text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <PlusCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Generate Room Code
                </motion.button>

                {roomCode && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200"
                  >
                    <p className="text-xs sm:text-sm text-gray-600 font-medium mb-2">Your Room Code:</p>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xl sm:text-2xl font-mono font-bold text-black">{roomCode}</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={copyToClipboard}
                        className="text-gray-600 hover:text-black"
                      >
                        <ClipboardDocumentIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </motion.button>
                    </div>
                    {showCopied && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs sm:text-sm text-gray-600 mt-2 flex items-center gap-1"
                      >
                        <HomeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
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
              className="bg-white backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 border border-gray-200 relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <UserGroupIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-800" />
                <h2 className="text-xl sm:text-2xl font-bold text-black">
                  Join Room
                </h2>
              </div>

              <div className="flex items-center gap-2 mb-6 sm:mb-8 text-gray-600">
                <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <p className="text-sm sm:text-base">Join your friends' game room and compete for properties!</p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="roomCode" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    id="roomCode"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter room code"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors uppercase font-mono text-sm sm:text-base"
                    maxLength={6}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleJoinRoom}
                  className="w-full bg-black text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  Join Game
                  <ArrowRightCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
                {error && (
                  <p className="text-xs sm:text-sm text-red-600 mt-2">{error}</p>
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
              className="mt-6 bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg"
            >
              <h3 className="text-xl font-bold mb-4">Room Information</h3>
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5" />
                  Players: {roomData.player_count} / {roomData.max_players}
                </p>
                <p className="flex items-center gap-2">
                  <HomeIcon className="w-5 h-5" />
                  Room ID: {roomData.room_id}
                </p>
                <p className="flex items-center gap-2">
                  <BuildingOffice2Icon className="w-5 h-5" />
                  Status: {roomData.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </motion.div>
          )}

          {/* Quick Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 sm:mt-8 bg-white/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/20"
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 text-center">
              Quick Tips
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2 text-sm sm:text-base">
                  <BanknotesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800 flex-shrink-0" />
                  Share the room code with your friends
                </li>
                <li className="flex items-center gap-2 text-sm sm:text-base">
                  <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800 flex-shrink-0" />
                  Play with 2-4 players in a room
                </li>
              </div>
              <div className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2 text-sm sm:text-base">
                  <BuildingOffice2Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800 flex-shrink-0" />
                  Keep your room code private
                </li>
                <li className="flex items-center gap-2 text-sm sm:text-base">
                  <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800 flex-shrink-0" />
                  Wait for all players before starting
                </li>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
