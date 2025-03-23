import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // console.log("API_BASE_URL:", API_BASE_URL);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchUserProfile = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                // console.log('User profile fetched:', userData);
            } else {
                // If token is invalid, clear it
                logout();
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            logout();
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem('accessToken');
        if (token) {
            fetchUserProfile();
        } else {
            setLoading(false);
        }
    }, [fetchUserProfile]);

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/token/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('The email or password you entered is incorrect. Please try again.');
            }

            const data = await response.json();
            localStorage.setItem('accessToken', data.access);
            localStorage.setItem('refreshToken', data.refresh);
            
            await fetchUserProfile();
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    };

    const register = async (username, email, password, password2) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password, password2 }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Capitalize the first letter of the error message
                const errorMessage = Object.values(errorData)[0][0];
                const capitalizedError = errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1);
                throw new Error(capitalizedError || 'Registration failed');
            }

            return { success: true };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        navigate('/login')
    };

    const value = { user, login, logout, register, loading, setUser };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
