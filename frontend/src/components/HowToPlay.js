import React from 'react';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  TrophyIcon,
  InformationCircleIcon,
  BoltIcon,
  HomeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Navbar from './auth/Navbar';

// Import images
import toActionImg from '../images/guide/ToAction.png';
import toBankImg from '../images/guide/ToBank.png';
import toPropertyImg from '../images/guide/ToProperty.png';
import victoryImg from '../images/guide/Victory.png';
import tieImg from '../images/guide/Tie.png';

const HowToPlay = () => {
  // Animation variants for consistent animations
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  // Common styles for better maintainability
  const styles = {
    section: "relative bg-white/60 rounded-2xl p-8 shadow-lg backdrop-blur-sm border border-gray-100",
    sectionHeader: "flex items-center mb-12 border-b border-gray-200 pb-6",
    icon: "w-12 h-12 text-gray-800 mr-6",
    heading: "text-4xl font-bold text-gray-900",
    subheading: "text-2xl font-semibold text-gray-800 mb-6 text-left",
    paragraph: "text-lg text-gray-700 leading-relaxed mb-8 max-w-3xl text-left",
    list: "list-disc pl-10 space-y-4 text-gray-700 leading-relaxed mb-12 max-w-3xl text-left",
    imageContainer: "relative bg-gray-50 rounded-xl overflow-hidden shadow-lg border border-gray-200 my-8 inline-block w-full",
    image: "w-full h-auto max-h-[400px] object-contain",
    caption: "absolute bottom-0 left-0 right-0 text-sm text-gray-600 italic bg-white/90 backdrop-blur-sm py-2 border-t border-gray-200",
    contentWrapper: "space-y-6"
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.15]" 
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0),
            radial-gradient(circle at 1px 1px, #ef4444 1px, transparent 0)
          `,
          backgroundSize: '40px 40px, 40px 40px',
          backgroundPosition: '0 0, 20px 20px',
        }}
      />
      
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large circles */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply opacity-30 animate-float" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-red-100 rounded-full mix-blend-multiply opacity-30 animate-float-delayed" />
        <div className="absolute bottom-1/4 -left-20 w-72 h-72 bg-yellow-100 rounded-full mix-blend-multiply opacity-30 animate-float" />
        
        {/* Small decorative shapes */}
        <div className="absolute top-1/4 right-1/4 w-12 h-12 border-4 border-blue-200 opacity-20 rotate-45" />
        <div className="absolute top-2/3 left-1/3 w-8 h-8 bg-red-200 opacity-20 rounded-full" />
        <div className="absolute bottom-1/3 right-1/3 w-16 h-16 border-4 border-yellow-200 opacity-20 transform rotate-12" />
      </div>

      <Navbar />
      {/* Main Container */}
      <div className="container mx-auto px-6 py-16 max-w-4xl pt-24 relative">
        {/* Hero Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="mb-24"
        >
          <h1 className="text-6xl font-bold mb-14 text-gray-900 tracking-tight">
            Cardopoly Guide
          </h1>
          <p className="text-xl text-gray-700 leading-loose">
            Ready to become a property tycoon? Follow this guide to learn how to play and win at Cardopoly.
            Let's begin your journey to mastery!
          </p>
        </motion.div>

        {/* Timeline Steps */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 ml-6" />

          {/* Step 1: Game Overview */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="relative mb-24 pl-20"
          >
            {/* Timeline Dot */}
            <div className="absolute left-0 w-12 h-12 rounded-full bg-white shadow-lg border-4 border-gray-300 flex items-center justify-center">
              <span className="text-xl font-bold">1</span>
            </div>
            
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <TrophyIcon className={styles.icon} />
                <h2 className={styles.heading}>Your Goal</h2>
              </div>
              <div className={styles.contentWrapper}>
                <p className={styles.paragraph}>
                  Your mission is simple but challenging: Be the first to collect <strong>3 complete property sets</strong> of different colors!
                </p>
                <ul className={styles.list}>
                  <li>Start with <strong>5 cards</strong> in your hand</li>
                  <li>Play up to <strong>3 cards</strong> on your turn</li>
                  <li>Build your <strong>property empire</strong></li>
                  <li><strong>Stop your opponents</strong> from completing their sets</li>
                </ul>
              </div>
              <div className={styles.imageContainer}>
                <img 
                  src={victoryImg} 
                  alt="Victory screen showing a complete game" 
                  className={styles.image}
                />
                <div className={styles.caption}>
                  Victory awaits! This is what success looks like.
                </div>
              </div>
            </div>
          </motion.section>

          {/* Step 2: Building Properties */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="relative mb-24 pl-20"
          >
            {/* Timeline Dot */}
            <div className="absolute left-0 w-12 h-12 rounded-full bg-white shadow-lg border-4 border-gray-300 flex items-center justify-center">
              <span className="text-xl font-bold">2</span>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <HomeIcon className={styles.icon} />
                <h2 className={styles.heading}>Building Your Empire</h2>
              </div>
              <div className={styles.contentWrapper}>
                <p className={styles.paragraph}>
                  Properties are your path to victory. Drag property cards from your hand to your <strong>property area</strong> to start building sets.
                </p>
                <ul className={styles.list}>
                  <li>Properties are automatically <strong>grouped by color</strong></li>
                  <li><strong>Complete sets</strong> are highlighted</li>
                  <li><strong>Wild cards</strong> can be used as any color</li>
                </ul>
              </div>
              <div className={styles.imageContainer}>
                <img 
                  src={toPropertyImg} 
                  alt="Dragging a property card" 
                  className={styles.image}
                />
                <div className={styles.caption}>
                  Drag properties to build your sets
                </div>
              </div>
            </div>
          </motion.section>

          {/* Step 3: Managing Wealth */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="relative mb-24 pl-20"
          >
            {/* Timeline Dot */}
            <div className="absolute left-0 w-12 h-12 rounded-full bg-white shadow-lg border-4 border-gray-300 flex items-center justify-center">
              <span className="text-xl font-bold">3</span>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <CurrencyDollarIcon className={styles.icon} />
                <h2 className={styles.heading}>Managing Your Wealth</h2>
              </div>
              <div className={styles.contentWrapper}>
                <p className={styles.paragraph}>
                  Your bank is your shield against rent and charges. <strong>Money cards</strong> and <strong>action cards</strong> can be stored here.
                </p>
                <ul className={styles.list}>
                  <li>Drag money cards to your <strong>bank</strong></li>
                  <li>Action cards can be <strong>banked for their value</strong></li>
                  <li>Keep enough money to pay <strong>potential rent</strong></li>
                </ul>
              </div>
              <div className={styles.imageContainer}>
                <img 
                  src={toBankImg} 
                  alt="Adding money to bank" 
                  className={styles.image}
                />
                <div className={styles.caption}>
                  Build your bank for protection and payments
                </div>
              </div>
            </div>
          </motion.section>

          {/* Step 4: Taking Action */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="relative mb-24 pl-20"
          >
            {/* Timeline Dot */}
            <div className="absolute left-0 w-12 h-12 rounded-full bg-white shadow-lg border-4 border-gray-300 flex items-center justify-center">
              <span className="text-xl font-bold">4</span>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <BoltIcon className={styles.icon} />
                <h2 className={styles.heading}>Taking Action</h2>
              </div>
              <div className={styles.contentWrapper}>
                <p className={styles.paragraph}>
                  Action cards are your tools for strategy and disruption. Use them wisely to advance your position or hinder your opponents.
                </p>
                <ul className={styles.list}>
                  <li><strong>Deal Breaker</strong> (5M): Steal a complete set</li>
                  <li><strong>Sly Deal</strong> (3M): Steal a single property</li>
                  <li><strong>Forced Deal</strong> (3M): Swap properties</li>
                  <li><strong>Just Say No</strong> (4M): Block an action against you</li>
                  <li><strong>It's Your Birthday</strong> (2M): Collect 2M from each player</li>
                  <li><strong>Debt Collector</strong> (3M): Collect 5M from one player</li>
                  <li><strong>Rent</strong> (1M): Collect rent for properties of a specific color</li>
                  <li><strong>Multi-Color Rent</strong> (3M): Collect rent for properties of any color</li>
                  <li><strong>Double The Rent</strong> (1M): Double the rent amount being charged</li>
                  <li><strong>Pass Go</strong> (1M): Draw 2 extra cards</li>
                </ul>
              </div>
              <div className={styles.imageContainer}>
                <img 
                  src={toActionImg} 
                  alt="Playing an action card" 
                  className={styles.image}
                />
                <div className={styles.caption}>
                  Play action cards to change the game
                </div>
              </div>
            </div>
          </motion.section>

          {/* Step 5: Game Outcomes */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="relative mb-24 pl-20"
          >
            {/* Timeline Dot */}
            <div className="absolute left-0 w-12 h-12 rounded-full bg-white shadow-lg border-4 border-gray-300 flex items-center justify-center">
              <span className="text-xl font-bold">5</span>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <InformationCircleIcon className={styles.icon} />
                <h2 className={styles.heading}>Game Outcomes</h2>
              </div>
              <div className={styles.contentWrapper}>
                <div className="space-y-8">
                  <div>
                    <h3 className={styles.subheading}>Victory</h3>
                    <p className={styles.paragraph}>
                      The game ends immediately when a player collects <strong>3 complete property sets</strong> of different colors. 
                      Keep track of your opponents' progress and use action cards to prevent them from winning!
                    </p>
                  </div>
                  <div>
                    <h3 className={styles.subheading}>Ties</h3>
                    <p className={styles.paragraph}>
                      If the <strong>draw pile runs out</strong> before anyone wins, the game ends in a tie. 
                      Make your moves count and try to win before the cards run out!
                    </p>
                  </div>
                </div>
              </div>
              <div className={styles.imageContainer}>
                <img 
                  src={tieImg} 
                  alt="Tie game screen" 
                  className={styles.image}
                />
                <div className={styles.caption}>
                  A tie occurs when cards run out
                </div>
              </div>
            </div>
          </motion.section>

          {/* Pro Tips */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="relative pl-20"
          >
            {/* Timeline Dot */}
            <div className="absolute left-0 w-12 h-12 rounded-full bg-white shadow-lg border-4 border-gray-300 flex items-center justify-center">
              <span className="text-xl font-bold">★</span>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <BoltIcon className={styles.icon} />
                <h2 className={styles.heading}>Pro Tips</h2>
              </div>
              <div className={styles.contentWrapper}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6 p-6 bg-white/40 rounded-xl border border-gray-200 backdrop-blur-sm">
                    <div className="flex items-start">
                      <BoltIcon className="w-8 h-8 text-blue-600 mr-3 mt-1" />
                      <h3 className={styles.subheading + " mb-0"}>Strategy</h3>
                    </div>
                    <ul className={styles.list + " mb-0"}>
                      <li>Focus on collecting sets that your opponents <strong>aren't pursuing</strong></li>
                      <li>Save <strong>powerful action cards</strong> for critical moments</li>
                      <li>Keep enough money in your bank to defend against <strong>rent</strong></li>
                      <li>Use <strong>wild cards</strong> strategically to complete sets</li>
                    </ul>
                  </div>
                  <div className="space-y-6 p-6 bg-white/40 rounded-xl border border-gray-200 backdrop-blur-sm">
                    <div className="flex items-start">
                      <ShieldCheckIcon className="w-8 h-8 text-red-600 mr-3 mt-1" />
                      <h3 className={styles.subheading + " mb-0"}>Defense</h3>
                    </div>
                    <ul className={styles.list + " mb-0"}>
                      <li>Watch out for opponents nearing <strong>three complete sets</strong></li>
                      <li>Keep <strong>Just Say No</strong> cards for protecting valuable properties</li>
                      <li>Save your <strong>Sly Deal</strong> cards to break opponents' near-complete sets</li>
                      <li><strong>Don't leave your bank empty</strong> - you'll need it for rent!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/60 py-8 border-t border-gray-200 mt-24 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <p className="text-gray-700">&copy; 2024 Cardopoly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  @keyframes float-delayed {
    0%, 100% { transform: translateY(0) rotate(0); }
    50% { transform: translateY(-20px) rotate(-5deg); }
  }
  .animate-float {
    animation: float 20s ease-in-out infinite;
  }
  .animate-float-delayed {
    animation: float-delayed 25s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

export default HowToPlay;
