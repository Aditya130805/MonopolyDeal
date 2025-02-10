import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRightIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon, 
  SparklesIcon,
  TrophyIcon,
  BookOpenIcon,
  PlayIcon,
  BoltIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import Navbar from './auth/Navbar';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
  const [userCount, setUserCount] = useState('...');

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/user-count/`);
        const data = await response.json();
        setUserCount(data.count.toLocaleString());
      } catch (error) {
        console.error('Error fetching user count:', error);
        setUserCount('10+');
      }
    };

    fetchUserCount();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto relative"
        >
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-sm font-medium">
            New Release 🥳
          </div>
          <h1 className="text-7xl font-bold mb-6 text-black mt-10 leading-tight pb-2">
            Cardopoly (Digital)
          </h1>
          <p className="text-2xl mb-8 text-gray-800 leading-relaxed">
            Experience the thrill of the classic card game in a modern digital format. 
            Build your property empire, outsmart your opponents, and become the ultimate real estate tycoon!
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            {user ? (
              <Link to="/play">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-black text-white px-10 py-4 rounded-full font-bold text-lg flex items-center shadow-lg hover:shadow-xl transition-shadow"
                >
                  Start Playing
                  <PlayIcon className="w-5 h-5 ml-2" />
                </motion.button>
              </Link>
            ) : (
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-black text-white px-10 py-4 rounded-full font-bold text-lg flex items-center shadow-lg hover:shadow-xl transition-shadow"
                >
                  Get Started
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </motion.button>
              </Link>
            )}
            <Link to="/how-to-play">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg flex items-center shadow-lg hover:shadow-xl transition-shadow"
              >
                How to Play
                <InformationCircleIcon className="w-5 h-5 ml-2" />
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto px-4">
          {[
            { number: `${userCount}`, label: "Players Worldwide" },
            { number: "4.8★", label: "Player Rating" },
            { number: "10+", label: "Games Played" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-lg"
            >
              <h3 className="text-4xl font-bold text-black mb-2">{stat.number}</h3>
              <p className="text-gray-800">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Features Section */}
        <div className="pt-24" id="features">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-black">Features</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <CurrencyDollarIcon className="w-12 h-12 text-gray-800" />,
                title: "Strategic Gameplay",
                description: "Master property collection, action cards, and rent collection in this fast-paced digital adaptation"
              },
              {
                icon: <UserGroupIcon className="w-12 h-12 text-gray-800" />,
                title: "Global Multiplayer",
                description: "Challenge friends or match with players worldwide in real-time competitive gameplay"
              },
              {
                icon: <SparklesIcon className="w-12 h-12 text-gray-800" />,
                title: "Modern Experience",
                description: "Enjoy smooth animations, intuitive controls, and beautiful visual effects"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="bg-white/60 backdrop-blur-lg rounded-xl p-8 text-center hover:bg-white/70 transition-colors shadow-lg"
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-3 text-black">{feature.title}</h3>
                <p className="text-gray-700 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How to Play Section */}
        <div className="pt-24" id="how-to-play">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 relative"
          >
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-100 text-gray-800 px-4 py-1 rounded-full text-sm font-medium">
              Quick Guide
            </div>
            <h2 className="text-4xl font-bold mb-6 text-black mt-12">How to Play</h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Master the game with these simple steps and become a Cardopoly champion!
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8 -mt-4">
            {[
              {
                icon: <BookOpenIcon className="w-8 h-8 text-gray-800" />,
                title: "Draw Cards",
                description: "Start your turn by drawing 2 cards from the deck"
              },
              {
                icon: <CurrencyDollarIcon className="w-8 h-8 text-gray-800" />,
                title: "Build Your Empire",
                description: "Play properties to build your monopoly"
              },
              {
                icon: <BoltIcon className="w-8 h-8 text-gray-800" />,
                title: "Take Actions",
                description: "Use action cards to demand money or steal properties"
              },
              {
                icon: <TrophyIcon className="w-8 h-8 text-gray-800" />,
                title: "Win the Game",
                description: "Be the first to collect 3 full property sets"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="bg-white/60 rounded-xl p-6 text-center shadow-lg"
              >
                <div className="flex justify-center mb-4 bg-gray-50 w-16 h-16 rounded-full items-center mx-auto">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-black">{step.title}</h3>
                <p className="text-gray-700">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="bg-gray-50 py-4 mt-4"
      >
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-4xl font-bold mb-8 text-black">Ready to Deal?</h2>
          <p className="text-xl mb-8 text-gray-700">
            Join millions of players in the digital Cardopoly revolution. 
            Your property empire awaits!
          </p>
          <div className="flex items-center justify-center gap-4">
            {user ? (
                <Link to="/play">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-black px-10 py-4 rounded-full font-bold text-lg text-white shadow-lg hover:shadow-xl transition-shadow"
                  >
                    Start Playing Now
                  </motion.button>
                </Link>
            ) : (
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-black px-10 py-4 rounded-full font-bold text-lg text-white shadow-lg hover:shadow-xl transition-shadow"
                >
                  Get Started
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="bg-white/80 py-6 mt-20 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-700">
          <p> 2024 Cardopoly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
