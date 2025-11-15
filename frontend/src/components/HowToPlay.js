import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  TrophyIcon,
  InformationCircleIcon,
  BoltIcon,
  HomeIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toActionImg from '../images/guide/ToAction.png';
import toBankImg from '../images/guide/ToBank.png';
import toPropertyImg from '../images/guide/ToProperty.png';
import victoryImg from '../images/guide/Victory.png';
import tieImg from '../images/guide/Tie.png';

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

const HowToPlay = () => {
  const { user, loading, logout } = useAuth();
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
      <section className="relative max-w-7xl mx-auto px-6 pt-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto relative z-10"
        >
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif text-gray-900 mb-6 leading-[1.05] tracking-tight">
            How to Play
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 font-light leading-relaxed">
            Ready to become a property tycoon? Follow this guide to learn how to play and win at Cardopoly.
          </p>
        </motion.div>
        
        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gray-100/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Content Sections */}
      <section className="relative max-w-5xl mx-auto px-6 py-12 pb-32">
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 ml-6 md:ml-8" />

          {/* Step 1: Your Goal */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative mb-24 pl-20 md:pl-28"
          >
            {/* Timeline Dot */}
            <div className="absolute left-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-lg border-4 border-gray-300 flex items-center justify-center z-10">
              <span className="text-xl md:text-2xl font-bold text-gray-900">1</span>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 md:p-12 shadow-2xl">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
                <div className="bg-black p-3 rounded-xl">
                  <TrophyIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-gray-900 leading-tight">
                  Your Goal
                </h2>
              </div>
              <div className="space-y-6 text-left">
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                  Your mission is simple but challenging: Be the first to collect <strong className="text-gray-900">3 complete property sets</strong> of different colors!
                </p>
                <ul className="space-y-3 text-base md:text-lg text-gray-600 leading-relaxed list-disc pl-6">
                  <li>Start with <strong className="text-gray-900">5 cards</strong> in your hand</li>
                  <li>Play up to <strong className="text-gray-900">3 cards</strong> on your turn</li>
                  <li>Build your <strong className="text-gray-900">property empire</strong></li>
                  <li><strong className="text-gray-900">Stop your opponents</strong> from completing their sets</li>
                </ul>
              </div>
              <div className="mt-8 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                <img 
                  src={victoryImg} 
                  alt="Victory screen showing a complete game" 
                  className="w-full h-auto max-h-[400px] object-contain"
                />
              </div>
            </div>
          </motion.div>

          {/* Step 2: Building Properties */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="relative mb-24 pl-20 md:pl-28"
          >
            {/* Timeline Dot */}
            <div className="absolute left-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-lg border-4 border-gray-300 flex items-center justify-center z-10">
              <span className="text-xl md:text-2xl font-bold text-gray-900">2</span>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 md:p-12 shadow-2xl">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
                <div className="bg-black p-3 rounded-xl">
                  <HomeIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-gray-900 leading-tight">
                  Building Your Empire
                </h2>
              </div>
              <div className="space-y-6 text-left">
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                  Properties are your path to victory. Drag property cards from your hand to your <strong className="text-gray-900">property area</strong> to start building sets.
                </p>
                <ul className="space-y-3 text-base md:text-lg text-gray-600 leading-relaxed list-disc pl-6">
                  <li>Properties are automatically <strong className="text-gray-900">grouped by color</strong></li>
                  <li><strong className="text-gray-900">Complete sets</strong> are highlighted</li>
                  <li><strong className="text-gray-900">Wild cards</strong> can be used as any color</li>
                </ul>
              </div>
              <div className="mt-8 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                <img 
                  src={toPropertyImg} 
                  alt="Dragging a property card" 
                  className="w-full h-auto max-h-[400px] object-contain"
                />
              </div>
            </div>
          </motion.div>

          {/* Step 3: Managing Wealth */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="relative mb-24 pl-20 md:pl-28"
          >
            {/* Timeline Dot */}
            <div className="absolute left-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-lg border-4 border-gray-300 flex items-center justify-center z-10">
              <span className="text-xl md:text-2xl font-bold text-gray-900">3</span>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 md:p-12 shadow-2xl">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
                <div className="bg-black p-3 rounded-xl">
                  <CurrencyDollarIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-gray-900 leading-tight">
                  Managing Your Wealth
                </h2>
              </div>
              <div className="space-y-6 text-left">
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                  Your bank is your shield against rent and charges. <strong className="text-gray-900">Money cards</strong> and <strong className="text-gray-900">action cards</strong> can be stored here.
                </p>
                <ul className="space-y-3 text-base md:text-lg text-gray-600 leading-relaxed list-disc pl-6">
                  <li>Drag money cards to your <strong className="text-gray-900">bank</strong></li>
                  <li>Action cards can be <strong className="text-gray-900">banked for their value</strong></li>
                  <li>Keep enough money to pay <strong className="text-gray-900">potential rent</strong></li>
                </ul>
              </div>
              <div className="mt-8 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                <img 
                  src={toBankImg} 
                  alt="Adding money to bank" 
                  className="w-full h-auto max-h-[400px] object-contain"
                />
              </div>
            </div>
          </motion.div>

          {/* Step 4: Taking Action */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="relative mb-24 pl-20 md:pl-28"
          >
            {/* Timeline Dot */}
            <div className="absolute left-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-lg border-4 border-gray-300 flex items-center justify-center z-10">
              <span className="text-xl md:text-2xl font-bold text-gray-900">4</span>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 md:p-12 shadow-2xl">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
                <div className="bg-black p-3 rounded-xl">
                  <BoltIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-gray-900 leading-tight">
                  Taking Action
                </h2>
              </div>
              <div className="space-y-6 text-left">
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                  Action cards are your tools for strategy and disruption. Use them wisely to advance your position or hinder your opponents.
                </p>
                <ul className="space-y-3 text-base md:text-lg text-gray-600 leading-relaxed list-disc pl-6">
                  <li><strong className="text-gray-900">Deal Breaker</strong> (5M): Steal a complete set</li>
                  <li><strong className="text-gray-900">Sly Deal</strong> (3M): Steal a single property</li>
                  <li><strong className="text-gray-900">Forced Deal</strong> (3M): Swap properties</li>
                  <li><strong className="text-gray-900">Just Say No</strong> (4M): Block an action against you</li>
                  <li><strong className="text-gray-900">It's Your Birthday</strong> (2M): Collect 2M from each player</li>
                  <li><strong className="text-gray-900">Debt Collector</strong> (3M): Collect 5M from one player</li>
                  <li><strong className="text-gray-900">Rent</strong> (1M): Collect rent for properties of a specific color</li>
                  <li><strong className="text-gray-900">Multi-Color Rent</strong> (3M): Collect rent for properties of any color</li>
                  <li><strong className="text-gray-900">Double The Rent</strong> (1M): Double the rent amount being charged</li>
                  <li><strong className="text-gray-900">Pass Go</strong> (1M): Draw 2 extra cards</li>
                </ul>
              </div>
              <div className="mt-8 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                <img 
                  src={toActionImg} 
                  alt="Playing an action card" 
                  className="w-full h-auto max-h-[400px] object-contain"
                />
              </div>
            </div>
          </motion.div>

          {/* Step 5: Game Outcomes */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="relative mb-24 pl-20 md:pl-28"
          >
            {/* Timeline Dot */}
            <div className="absolute left-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-lg border-4 border-gray-300 flex items-center justify-center z-10">
              <span className="text-xl md:text-2xl font-bold text-gray-900">5</span>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 md:p-12 shadow-2xl">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
                <div className="bg-black p-3 rounded-xl">
                  <InformationCircleIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-gray-900 leading-tight">
                  Game Outcomes
                </h2>
              </div>
              <div className="space-y-8 text-left">
                <div>
                  <h3 className="text-2xl md:text-3xl font-serif text-gray-900 mb-4 text-left">Victory</h3>
                  <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                    The game ends immediately when a player collects <strong className="text-gray-900">3 complete property sets</strong> of different colors. 
                    Keep track of your opponents' progress and use action cards to prevent them from winning!
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-serif text-gray-900 mb-4 text-left">Ties</h3>
                  <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                    If the <strong className="text-gray-900">draw pile runs out</strong> before anyone wins, the game ends in a tie. 
                    Make your moves count and try to win before the cards run out!
                  </p>
                </div>
              </div>
              <div className="mt-8 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                <img 
                  src={tieImg} 
                  alt="Tie game screen" 
                  className="w-full h-auto max-h-[400px] object-contain"
                />
              </div>
            </div>
          </motion.div>

          {/* Pro Tips */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="relative pl-20 md:pl-28"
          >
            {/* Timeline Dot */}
            <div className="absolute left-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-lg border-4 border-gray-300 flex items-center justify-center z-10">
              <span className="text-xl md:text-2xl font-bold text-gray-900">★</span>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 md:p-12 shadow-2xl">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
                <div className="bg-black p-3 rounded-xl">
                  <BoltIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-gray-900 leading-tight">
                  Pro Tips
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-200 text-left">
                  <div className="flex items-center gap-3">
                    <BoltIcon className="w-8 h-8 text-blue-600" />
                    <h3 className="text-2xl md:text-3xl font-serif text-gray-900">Strategy</h3>
                  </div>
                  <ul className="space-y-3 text-base md:text-lg text-gray-600 leading-relaxed list-disc pl-6">
                    <li>Focus on collecting sets that your opponents <strong className="text-gray-900">aren't pursuing</strong></li>
                    <li>Save <strong className="text-gray-900">powerful action cards</strong> for critical moments</li>
                    <li>Keep enough money in your bank to defend against <strong className="text-gray-900">rent</strong></li>
                    <li>Use <strong className="text-gray-900">wild cards</strong> strategically to complete sets</li>
                  </ul>
                </div>
                <div className="space-y-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-200 text-left">
                  <div className="flex items-center gap-3">
                    <ShieldCheckIcon className="w-8 h-8 text-red-600" />
                    <h3 className="text-2xl md:text-3xl font-serif text-gray-900">Defense</h3>
                  </div>
                  <ul className="space-y-3 text-base md:text-lg text-gray-600 leading-relaxed list-disc pl-6">
                    <li>Watch out for opponents nearing <strong className="text-gray-900">three complete sets</strong></li>
                    <li>Keep <strong className="text-gray-900">Just Say No</strong> cards for protecting valuable properties</li>
                    <li>Save your <strong className="text-gray-900">Sly Deal</strong> cards to break opponents' near-complete sets</li>
                    <li><strong className="text-gray-900">Don't leave your bank empty</strong> - you'll need it for rent!</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
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
};

export default HowToPlay;
