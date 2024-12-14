import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserIcon, KeyIcon, ArrowRightStartOnRectangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

const UserSettings = () => {
    const navigate = useNavigate();
    const { user, logout, setUser } = useAuth();
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

            const response = await fetch('http://localhost:8000/api/auth/me/', {
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

        if (formData.newPassword.length < 6) {
            setError('New password is too short (min. 6)');
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:8000/api/auth/me/password/', {
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

            const response = await fetch('http://localhost:8000/api/auth/me/delete/', {
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
        <div className="min-h-screen bg-gray-50 relative">
            <Navbar />
            
            <div className="flex h-[calc(100vh-64px)]">
                {/* Sidebar - Hidden on mobile */}
                <div className="hidden lg:flex w-80 bg-gray-100 border-r border-gray-200 flex-col">
                    <div className="flex-1">
                        <div className="p-8">
                            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
                            <p className="mt-2 text-sm text-gray-600">Manage your account preferences</p>
                        </div>
                        <nav className="px-4">
                            {tabs.map((tab) => (
                                <motion.button
                                    key={tab.id}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-start gap-4 p-4 rounded-lg mb-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-white shadow-sm'
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <tab.icon className={`w-5 h-5 mt-0.5 ${
                                        activeTab === tab.id ? 'text-black' : 'text-gray-500'
                                    }`} />
                                    <div className="text-left">
                                        <p className={`text-sm font-medium ${
                                            activeTab === tab.id ? 'text-black' : 'text-gray-700'
                                        }`}>
                                            {tab.name}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {tab.description}
                                        </p>
                                    </div>
                                </motion.button>
                            ))}
                        </nav>
                    </div>
                    
                    {/* Logout Button */}
                    <div className="p-4 border-t border-gray-200">
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-4 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                            <span className="text-sm font-medium">Log Out</span>
                        </motion.button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50 pb-20 lg:pb-8">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                                {/* Mobile Header */}
                                <div className="block lg:hidden mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
                                    <p className="mt-2 text-sm text-gray-600">Update your profile information</p>
                                </div>

                                {/* Profile Card */}
                                <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200 shadow-sm w-full">
                                    <div className="flex items-start gap-4 mb-8">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <UserIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xl font-semibold text-gray-900">Profile</div>
                                            <div className="text-sm text-gray-500">Choose how others see you</div>
                                        </div>
                                    </div>
                                    <form onSubmit={handleUsernameUpdate} className="space-y-4">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="username"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="Enter new username"
                                            />
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md"
                                        >
                                            Update Username
                                        </motion.button>
                                    </form>
                                </div>

                                {/* Email Card */}
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 sm:p-8 border border-gray-200 shadow-sm w-full">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-lg font-medium text-gray-800">Email Address</div>
                                            <div className="text-sm text-gray-800 mt-1">{user?.email}</div>
                                            {/* <div className="text-xs text-gray-500 mt-2">This email is associated with your account and cannot be changed</div> */}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8 border border-blue-100 shadow-sm w-full">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-sm font-semibold text-blue-900">Username Guidelines</h3>
                                        </div>
                                        <ul className="space-y-3 text-sm text-blue-800 text-left">
                                            <li className="flex items-start gap-2">
                                                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Choose a username that represents you professionally</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Avoid using personal information</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Keep it family-friendly</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 sm:p-8 border border-purple-100 shadow-sm w-full">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-sm font-semibold text-purple-900">Gaming Identity</h3>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm text-purple-800 leading-relaxed">
                                                Your username is your gaming identity in Monopoly Deal. Choose a memorable name that reflects your playing style while keeping it friendly and appropriate for all players.
                                            </p>
                                        </div>
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
                                {/* Mobile Header */}
                                <div className="block lg:hidden mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                                    <p className="mt-2 text-sm text-gray-600">Manage your account security</p>
                                </div>
                                <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200 shadow-sm w-full">
                                    <div className="flex items-start gap-4 mb-8">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <KeyIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xl font-semibold text-gray-900">Password</div>
                                            <div className="text-sm text-gray-500">Keep your account protected</div>
                                        </div>
                                    </div>
                                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                        <div className="space-y-4">
                                            <input
                                                type="password"
                                                id="currentPassword"
                                                name="currentPassword"
                                                value={formData.currentPassword}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="Current password"
                                            />
                                            <input
                                                type="password"
                                                id="newPassword"
                                                name="newPassword"
                                                value={formData.newPassword}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="New password"
                                            />
                                            <input
                                                type="password"
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md"
                                        >
                                            Update Password
                                        </motion.button>
                                    </form>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8 border border-blue-100 shadow-sm w-full">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-sm font-semibold text-blue-900">Account Security Guidelines</h3>
                                        </div>
                                        <ul className="space-y-3 text-sm text-blue-800 text-left">
                                            <li className="flex items-start gap-2">
                                                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Create a password with at least 6 characters, including uppercase, lowercase, numbers, and special characters</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Avoid using personal information like birthdays, names, or common words in your password</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Use a unique password for your Monopoly Deal account to prevent unauthorized access</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Never share your login credentials or account details with other players or support staff</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Update your password regularly and whenever you suspect unauthorized access</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Delete Account Section */}
                                    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 sm:p-8 border border-red-200 shadow-sm w-full">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <div className="text-xl font-semibold text-red-900">Delete Account</div>
                                                <div className="text-sm text-red-800 mt-1">This action cannot be undone. Please be certain.</div>
                                            </div>
                                        </div>
                                        
                                        <div className="mb-4">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="password"
                                                    id="deleteAccountPassword"
                                                    name="deleteAccountPassword"
                                                    value={formData.deleteAccountPassword}
                                                    onChange={handleChange}
                                                    className="block w-full pl-10 pr-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                    placeholder="Enter your current password"
                                                />
                                            </div>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => {
                                                if (!formData.deleteAccountPassword) {
                                                    setError('Please enter your current password');
                                                    return;
                                                }

                                                // Verify password before showing modal
                                                const token = localStorage.getItem('accessToken');
                                                fetch('http://localhost:8000/api/auth/me/password/verify/', {
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
                                            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors shadow-md"
                                        >
                                            Delete My Account
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Mobile Bottom Navigation - Outside scroll container */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
                    <div className="flex justify-around items-center h-16">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex flex-col items-center justify-center w-1/2 py-2 relative ${
                                activeTab === 'profile' ? 'text-blue-600' : 'text-gray-600'
                            }`}
                        >
                            <UserIcon className="w-6 h-6" />
                            <span className="text-xs mt-1">Profile</span>
                            {activeTab === 'profile' && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-blue-50 rounded-lg"
                                    style={{ zIndex: -1 }}
                                    initial={false}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`flex flex-col items-center justify-center w-1/2 py-2 relative ${
                                activeTab === 'security' ? 'text-blue-600' : 'text-gray-600'
                            }`}
                        >
                            <KeyIcon className="w-6 h-6" />
                            <span className="text-xs mt-1">Security</span>
                            {activeTab === 'security' && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-blue-50 rounded-lg"
                                    style={{ zIndex: -1 }}
                                    initial={false}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
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
                        className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
                    >
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
                            <p className="mt-2 text-sm text-gray-600">
                                Are you sure you want to delete your account? This action cannot be undone and you will lose all your data.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleDeleteAccount}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Yes, Delete
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default UserSettings;
