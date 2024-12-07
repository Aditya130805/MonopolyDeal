import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Navbar from './Navbar';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password2: ''
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.password2) {
            setError("Passwords don't match");
            return;
        }

        const result = await register(formData);
        if (result.success) {
            navigate('/');  
        } else {
            setError(result.error || 'Failed to register');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 relative">
            <Navbar />
            <div className="relative overflow-hidden">
                {/* Animated background bubbles */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
                    <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float-delay-2"></div>
                    <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float-delay-4"></div>
                </div>

                <div className="container mx-auto px-4 py-20 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-md mx-auto"
                    >
                        <div className="text-center relative">
                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-sm font-medium">
                                Join the Fun 🎮
                            </div>
                            <h2 className="text-4xl font-bold text-black mt-10 mb-4">
                                Create your account
                            </h2>
                            <p className="text-gray-600 mb-8">
                                Already have an account?{' '}
                                <Link to="/login" className="text-black font-semibold hover:text-gray-700 transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="bg-white/60 backdrop-blur-lg rounded-xl p-8 shadow-lg"
                        >
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="rounded-lg bg-red-50 p-4">
                                        <div className="text-sm text-red-700">{error}</div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                                            Username
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <UserIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                id="username"
                                                name="username"
                                                type="text"
                                                required
                                                className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                                                placeholder="Choose a username"
                                                value={formData.username}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                                            Email address
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                id="email-address"
                                                name="email"
                                                type="email"
                                                autoComplete="email"
                                                required
                                                className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                                                placeholder="you@example.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                id="password"
                                                name="password"
                                                type="password"
                                                required
                                                className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                                                placeholder="Create a password"
                                                value={formData.password}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="password2" className="block text-sm font-medium text-gray-700 mb-2 text-left">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                id="password2"
                                                name="password2"
                                                type="password"
                                                required
                                                className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                                                placeholder="Confirm your password"
                                                value={formData.password2}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
                                >
                                    Create Account
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                </div>

                <style jsx>{`
                    @keyframes float {
                        0% { transform: translate(0, 0) rotate(0deg); }
                        33% { transform: translate(30px, -30px) rotate(5deg); }
                        66% { transform: translate(-20px, 20px) rotate(-5deg); }
                        100% { transform: translate(0, 0) rotate(0deg); }
                    }
                    .animate-float {
                        animation: float 20s ease-in-out infinite;
                    }
                    .animate-float-delay-2 {
                        animation: float 20s ease-in-out infinite;
                        animation-delay: -5s;
                    }
                    .animate-float-delay-4 {
                        animation: float 20s ease-in-out infinite;
                        animation-delay: -10s;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default Register;
