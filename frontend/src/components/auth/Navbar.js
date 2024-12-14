import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { 
    // UserIcon, 
    ChevronDownIcon,
    Cog6ToothIcon,
    ArrowRightStartOnRectangleIcon,
    UserCircleIcon,
    PlayIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const location = useLocation(); // Get the current location

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        setDropdownOpen(false);
    };

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold text-black">MonopolyDeal</span>
                        </Link>
                    </div>

                    <div className="flex items-center">
                        {user ? (
                            <>
                                {/* Conditionally show Play Now only if on homepage */}
                                {location.pathname === '/' && (
                                    <Link to="/play">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="mr-4 bg-black text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
                                        >
                                            <span className="hidden sm:inline">Play Now</span>
                                            <span className="sm:hidden">Play</span>
                                            <PlayIcon className="w-4 h-4" />
                                        </motion.button>
                                    </Link>
                                )}
                                <div className="relative" ref={dropdownRef}>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                    >
                                        <UserCircleIcon className="w-5 h-5" />
                                        <span className="hidden md:inline">{user.username}</span>
                                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                                    </motion.button>

                                    {dropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50"
                                        >
                                            <Link
                                                to="/settings"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                                            >
                                                <Cog6ToothIcon className="w-5 h-5" />
                                                Settings
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                                            >
                                                <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                                                Logout
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="block">
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="text-gray-700 hover:text-black transition-colors px-4 py-2 cursor-pointer"
                                    >
                                        Login
                                    </motion.div>
                                </Link>
                                <Link to="/register" className="block">
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-900 transition-colors cursor-pointer"
                                    >
                                        Register
                                    </motion.div>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
