import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserIcon, KeyIcon, ArrowRightStartOnRectangleIcon, LockClosedIcon, GlobeAltIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

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

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const UserSettings = () => {
    const navigate = useNavigate();
    const { user, logout, setUser } = useAuth();
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
    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        username: user?.username || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        deleteAccountPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Auto-dismiss notifications
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess('');
                setError('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setSuccess('');
    };

    const handleUsernameUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.username.trim()) {
            setError('Username cannot be empty');
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/auth/me/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: formData.username
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                if (data.username) {
                    setError(data.username);
                } else if (data.detail) {
                    setError(data.detail);
                } else {
                    setError('Failed to update username');
                }
                return;
            }

            setSuccess('Username updated successfully!');
            setUser(prev => ({
                ...prev,
                username: formData.username
            }));
        } catch (error) {
            setError('Something went wrong');
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setError('Please fill in all password fields');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (formData.newPassword.length < 8) {
            setError('New password is too short (min. 8)');
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/auth/me/password/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: formData.currentPassword,
                    new_password: formData.newPassword
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                // Handle specific error messages from backend
                if (data.current_password) {
                    setError('Current password is incorrect');
                } else if (data.new_password) {
                    setError(data.new_password);
                } else if (data.detail) {
                    setError(data.detail);
                } else {
                    setError('Failed to update password');
                }
                return;
            }

            setSuccess('Password updated successfully!');
            
            // Clear password fields
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (error) {
            setError('Something went wrong');
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            setError('Failed to log out');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            if (!formData.deleteAccountPassword) {
                setError('Please enter your current password');
                return;
            }

            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/auth/me/delete/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: formData.deleteAccountPassword
                })
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Failed to delete account');
                return;
            }

            // Account deleted successfully, log out and redirect
            await logout();
            navigate('/login');
        } catch (error) {
            setError('Something went wrong while deleting your account');
        }
    };

    const tabs = [
        {
            id: 'profile',
            name: 'Profile',
            icon: UserIcon,
            description: 'Manage your personal information'
        },
        {
            id: 'security',
            name: 'Security',
            icon: KeyIcon,
            description: 'Update your password and security settings'
        }
    ];

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
                                {user && (
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
                                                            handleLogout();
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
                                )}
                            </div>
                        </div>
                    </div>
                </motion.nav>
            </div>
            
            <div className="relative pt-32 pb-20">
            <div className="max-w-6xl mx-auto px-6">
                {/* Settings Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-gray-900 mb-4 leading-tight">
                        Settings
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 font-light">
                        Manage your account preferences
                    </p>
                </motion.div>

                {/* Tab Navigation - Desktop */}
                <div className="hidden lg:flex justify-center gap-4 mb-12">
                    {tabs.map((tab) => (
                        <motion.button
                            key={tab.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all ${
                                activeTab === tab.id
                                    ? 'bg-black text-white shadow-lg'
                                    : 'bg-white/80 backdrop-blur-xl border border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <tab.icon className={`w-5 h-5 ${
                                activeTab === tab.id ? 'text-white' : 'text-gray-500'
                            }`} />
                            <span className="font-semibold">{tab.name}</span>
                        </motion.button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="pb-20 lg:pb-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Notification Messages */}
                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, x: 100, scale: 0.8 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 100, scale: 0.8 }}
                                    transition={{ 
                                        type: "spring",
                                        stiffness: 100,
                                        damping: 15,
                                        mass: 1
                                    }}
                                    className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 z-50 flex items-center gap-4 text-red-600 bg-red-50 px-6 py-4 rounded-xl shadow-2xl max-w-md border border-red-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 flex-shrink-0">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-base font-medium">{error}</p>
                                </motion.div>
                            )}
                            {success && (
                                <motion.div 
                                    initial={{ opacity: 0, x: 100, scale: 0.8 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 100, scale: 0.8 }}
                                    transition={{ 
                                        type: "spring",
                                        stiffness: 100,
                                        damping: 15,
                                        mass: 1
                                    }}
                                    className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 z-50 flex items-center gap-4 text-green-600 bg-green-50 px-6 py-4 rounded-xl shadow-2xl max-w-md border border-green-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 flex-shrink-0">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-base font-medium">{success}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6 w-full max-w-3xl mx-auto"
                            >

                                {/* Profile Card */}
                                <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl w-full mb-6">
                                    <div className="flex items-start gap-4 mb-8 pb-6 border-b border-gray-200">
                                        <div className="bg-black p-3 rounded-xl">
                                            <UserIcon className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Profile</h3>
                                            <p className="text-base text-gray-600 mt-1">Choose how others see you</p>
                                        </div>
                                    </div>
                                    <form onSubmit={handleUsernameUpdate} className="space-y-6">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="username"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleChange}
                                                className="w-full px-6 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors text-base"
                                                placeholder="Enter new username"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full rounded-full"
                                        >
                                            Update Username
                                        </Button>
                                    </form>
                                </div>

                                {/* Email Card */}
                                <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl w-full mb-6">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-gray-100 p-3 rounded-xl">
                                            <svg className="w-8 h-8 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-bold text-gray-900">Email Address</h3>
                                            <p className="text-base text-gray-600 mt-1">{user?.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl w-full">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="bg-gray-100 p-2 rounded-lg">
                                                <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900">Username Guidelines</h3>
                                        </div>
                                        <ul className="space-y-4 text-base text-gray-600 text-left">
                                            <li className="flex items-start gap-3">
                                                <svg className="w-6 h-6 text-gray-800 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Choose a username that represents you professionally</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <svg className="w-6 h-6 text-gray-800 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Avoid using personal information</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <svg className="w-6 h-6 text-gray-800 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Keep it family-friendly</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6 w-full max-w-3xl mx-auto"
                            >
                                <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl w-full mb-6">
                                    <div className="flex items-start gap-4 mb-8 pb-6 border-b border-gray-200">
                                        <div className="bg-black p-3 rounded-xl">
                                            <KeyIcon className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Password</h3>
                                            <p className="text-base text-gray-600 mt-1">Keep your account protected</p>
                                        </div>
                                    </div>
                                    <form onSubmit={handlePasswordUpdate} className="space-y-6">
                                        <div className="space-y-4">
                                            <input
                                                type="password"
                                                id="currentPassword"
                                                name="currentPassword"
                                                value={formData.currentPassword}
                                                onChange={handleChange}
                                                className="w-full px-6 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors text-base"
                                                placeholder="Current password"
                                            />
                                            <input
                                                type="password"
                                                id="newPassword"
                                                name="newPassword"
                                                value={formData.newPassword}
                                                onChange={handleChange}
                                                className="w-full px-6 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors text-base"
                                                placeholder="New password"
                                            />
                                            <input
                                                type="password"
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className="w-full px-6 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors text-base"
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full rounded-full"
                                        >
                                            Update Password
                                        </Button>
                                    </form>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl w-full mb-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="bg-gray-100 p-2 rounded-lg">
                                                <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900">Account Security Guidelines</h3>
                                        </div>
                                        <ul className="space-y-4 text-base text-gray-600 text-left">
                                            <li className="flex items-start gap-3">
                                                <svg className="w-6 h-6 text-gray-800 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Create a password with at least 8 characters</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <svg className="w-6 h-6 text-gray-800 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Avoid using personal information like birthdays, names, or common words</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <svg className="w-6 h-6 text-gray-800 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Use a unique password for your Cardopoly account</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Delete Account Section */}
                                    <div className="bg-white/80 backdrop-blur-xl border border-red-200 rounded-3xl p-8 shadow-2xl w-full">
                                        <div className="flex items-start gap-4 mb-8 pb-6 border-b border-red-200">
                                            <div className="bg-red-100 p-3 rounded-xl">
                                                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-2xl font-bold text-red-900">Delete Account</h3>
                                                <p className="text-base text-red-800 mt-1">This action cannot be undone. Please be certain.</p>
                                            </div>
                                        </div>
                                        
                                        <div className="mb-6">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="password"
                                                    id="deleteAccountPassword"
                                                    name="deleteAccountPassword"
                                                    value={formData.deleteAccountPassword}
                                                    onChange={handleChange}
                                                    className="block w-full pl-12 pr-4 py-4 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base"
                                                    placeholder="Enter your current password"
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => {
                                                if (!formData.deleteAccountPassword) {
                                                    setError('Please enter your current password');
                                                    return;
                                                }

                                                // Verify password before showing modal
                                                const token = localStorage.getItem('accessToken');
                                                fetch(`${API_BASE_URL}/auth/me/password/verify/`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({
                                                        password: formData.deleteAccountPassword
                                                    })
                                                })
                                                .then(response => {
                                                    if (response.ok) {
                                                        setShowDeleteModal(true);
                                                        return;
                                                    }
                                                    return response.json().then(data => {
                                                        throw new Error(data.error || 'Password verification failed');
                                                    });
                                                })
                                                .catch(error => {
                                                    setError(error.message || 'Password verification failed');
                                                });
                                            }}
                                            className="w-full rounded-full bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            Delete My Account
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 z-50 shadow-2xl">
                    <div className="flex justify-around items-center h-16">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex flex-col items-center justify-center w-1/2 py-2 relative ${
                                activeTab === 'profile' ? 'text-black' : 'text-gray-600'
                            }`}
                        >
                            <UserIcon className="w-6 h-6" />
                            <span className="text-xs mt-1 font-medium">Profile</span>
                            {activeTab === 'profile' && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-gray-100 rounded-lg"
                                    style={{ zIndex: -1 }}
                                    initial={false}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`flex flex-col items-center justify-center w-1/2 py-2 relative ${
                                activeTab === 'security' ? 'text-black' : 'text-gray-600'
                            }`}
                        >
                            <KeyIcon className="w-6 h-6" />
                            <span className="text-xs mt-1 font-medium">Security</span>
                            {activeTab === 'security' && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-gray-100 rounded-lg"
                                    style={{ zIndex: -1 }}
                                    initial={false}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    </div>
                </div>
            </div>
            </div>

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Delete Account</h3>
                            <p className="text-base text-gray-600 leading-relaxed">
                                Are you sure you want to delete your account? This action cannot be undone and you will lose all your data.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <Button
                                onClick={() => setShowDeleteModal(false)}
                                variant="outline"
                                className="flex-1 rounded-full"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDeleteAccount}
                                className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white"
                            >
                                Yes, Delete
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default UserSettings;
