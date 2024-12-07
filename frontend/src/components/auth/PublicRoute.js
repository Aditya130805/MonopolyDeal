import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PublicRoute = ({ children }) => {
    const { user } = useAuth();

    if (user) {
        // If user is authenticated, redirect to home page
        return <Navigate to="/" replace />;
    }

    // If user is not authenticated, show the public route
    return children;
};

export default PublicRoute;
