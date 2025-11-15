import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRightIcon,
  GlobeAltIcon,
  ArrowRightStartOnRectangleIcon,
  UserIcon,
  Cog6ToothIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import victoryImg from '../images/guide/Victory.png';
import toPropertyImg from '../images/guide/ToProperty.png';
import toActionImg from '../images/guide/ToAction.png';

const dynamicWords = ['confusing', 'slow', 'boring', 'difficult', 'messy'];
// Google colors: blue, red, yellow, green, and adding a 5th color
const wordColors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853', '#9C27B0']; // blue, red, yellow, green, purple

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

export default function LandingPage() {
  const { user, loading, logout } = useAuth();
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
  const [userCount, setUserCount] = useState('...');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  }, [API_BASE_URL]);

  useEffect(() => {
    const currentWord = dynamicWords[wordIndex];
    const typingSpeed = isDeleting ? 50 : 100;
    const pauseTime = isDeleting ? 500 : 2000;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (displayText.length < currentWord.length) {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        } else {
          // Finished typing, wait then start deleting
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        // Deleting
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          // Finished deleting, move to next word
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % dynamicWords.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, wordIndex]);

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
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
              <div className="flex items-center gap-2">
                <div className="bg-black p-2 rounded-lg">
                  <GlobeAltIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Cardopoly</span>
              </div>
              
              <div className="flex items-center gap-3">
                {!loading && (
                  <>
                    {user ? (
                      <>
                        <Link to="/play">
                          <Button size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
                            Play Now
                          </Button>
                        </Link>
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

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-40 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-6xl mx-auto relative z-10"
        >
          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif text-gray-900 mb-6 leading-[1.05] tracking-tight">
            Your card game doesn't<br />have to be{' '}
            <span 
              className="italic font-light inline-block min-w-[280px] text-left transition-colors duration-300"
              style={{ color: wordColors[wordIndex % 5] }}
            >
              {displayText}
              <span className="animate-pulse">|</span>
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-2xl md:text-3xl text-gray-900 mb-8 font-light">
            Play it. Strategize it. Own it.
          </p>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Cardopoly transforms the classic Monopoly Deal experience into an interactive digital game. 
            Connect with friends, build your property empire, and see your strategy unfold in real-time.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {user ? (
              <Link to="/play">
                <Button size="lg" className="rounded-full h-14 px-10 text-base">
                  Start Playing
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="lg" className="rounded-full h-14 px-10 text-base">
                  Get Started Free
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
            <Link to="/how-to-play">
              <Button size="lg" className="rounded-full h-14 px-10 text-base bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
                How to Play
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <p className="text-sm text-gray-500 mt-8">
            Join players building their property empires
          </p>
        </motion.div>
        
        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gray-100/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Stats Section */}
      <section className="relative max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
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
              className="text-center"
            >
              <h3 className="text-6xl md:text-7xl lg:text-8xl font-serif text-gray-900 mb-4 leading-tight tracking-tight">
                {stat.number}
              </h3>
              <p className="text-lg md:text-xl text-gray-600 font-light">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature 1: Play Everything */}
      <section className="relative max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-gray-900 mb-6 leading-tight">
              <span className="italic font-light">Play</span> everything
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              All your cards in one place.
            </p>
            <p className="text-base text-gray-600 leading-relaxed">
              Manage properties, money, and action cards seamlessly. See your game state clearly — easy to understand, easy to strategize.
            </p>
          </motion.div>

          {/* Game Interface Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="relative h-[400px] rounded-3xl bg-gray-50 border border-gray-300 overflow-hidden shadow-xl"
          >
            <img 
              src={victoryImg} 
              alt="Game Interface Preview" 
              className="w-full h-full max-h-[400px] object-contain"
            />
          </motion.div>
        </div>
      </section>

      {/* Feature 2: Build Empire */}
      <section className="relative max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="md:order-2"
          >
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-gray-900 mb-6 leading-tight">
              <span className="italic font-light">Build</span> empires
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Collect properties and dominate.
            </p>
            <p className="text-base text-gray-600 leading-relaxed">
              Gather complete property sets, collect rent, and use action cards strategically. Every move counts toward building your real estate empire.
            </p>
          </motion.div>

          {/* Property Collection */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="relative h-[400px] rounded-3xl bg-gray-50 border border-gray-300 overflow-hidden shadow-xl md:order-1"
          >
            <img 
              src={toPropertyImg} 
              alt="Property Collection" 
              className="w-full h-full max-h-[400px] object-contain"
            />
          </motion.div>
        </div>
      </section>

      {/* Feature 3: Share */}
      <section className="relative max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-gray-900 mb-6 leading-tight">
              <span className="italic font-light">Challenge</span> friends
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Real-time multiplayer gameplay.
            </p>
            <p className="text-base text-gray-600 leading-relaxed">
              Play with friends or match with players worldwide. Experience smooth, lag-free gameplay that brings the Monopoly Deal experience to life.
            </p>
          </motion.div>

          {/* Multiplayer Experience */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="relative h-[400px] rounded-3xl bg-gray-50 border border-gray-300 overflow-hidden shadow-xl"
          >
            <img 
              src={toActionImg} 
              alt="Multiplayer Experience" 
              className="w-full h-full max-h-[400px] object-contain"
            />
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative max-w-5xl mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-gray-900 mb-8 leading-tight">
            Start playing now
          </h2>
          <p className="text-lg text-gray-600 mb-10">
            Join players who build property empires.
          </p>
          {user ? (
            <Link to="/play">
              <Button size="lg" className="rounded-full h-12 px-8">
                Start Playing
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button size="lg" className="rounded-full h-12 px-8">
                Get Started
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center text-gray-500 text-sm space-y-4">
            <p>© 2025 Cardopoly. Built for players who think strategically.</p>
            <div className="flex items-center justify-center gap-6 pt-4">
              <a 
                href="https://theadityaagarwal.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LinkIcon className="w-5 h-5" />
                <span>Portfolio</span>
              </a>
              <a 
                href="https://linkedin.com/in/aditya130805" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span>LinkedIn</span>
              </a>
              <a 
                href="https://github.com/aditya130805" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                </svg>
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
