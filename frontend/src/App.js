import { React, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import GameRoom from './components/GameRoom';
import ActiveGameRoom from './components/ActiveGameRoom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import UserSettings from './components/auth/UserSettings';
import MainGame from './components/MainGame';
import PrivateRoute from './components/auth/PrivateRoute';
import PublicRoute from './components/auth/PublicRoute';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent /> {/* Extract content to a separate component */}
      </AuthProvider>
    </Router>
  );
}

function AppContent() { // New component to use the hook
  const { user } = useAuth();
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
      if (user) {
          setPlayerId(user.unique_id);
      } else {
          setPlayerId(null);
      }
  }, [user]);

  return (
      <DndProvider backend={HTML5Backend}>
        <WebSocketProvider playerId={playerId}> {/* ONE provider at the top */}
            <div className="App">
          <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } 
              />
              {/* Routes that require authentication */}
              {user && ( // Conditionally render protected routes
                <>
                  <Route 
                    path="/settings" 
                    element={
                      <PrivateRoute>
                        <UserSettings />
                      </PrivateRoute>
                    } 
                  />
                  <Route
                    path="/play"
                    element={
                      <PrivateRoute>
                        <GameRoom />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/room/:roomId"
                    element={
                      <PrivateRoute>
                        <ActiveGameRoom />
                      </PrivateRoute>
                    }
                  />
                  <Route 
                    path="/game/:roomId" 
                    element={
                      <PrivateRoute>
                        <MainGame />
                      </PrivateRoute>
                    }
                  />
                </>
              )}
            </Routes>
          </div>
        </WebSocketProvider>
      </DndProvider>
  );
}

export default App;
