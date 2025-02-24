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
import HowToPlay from './components/HowToPlay';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { GameStateProvider } from './contexts/GameStateContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { WebSocketMessageQueueProvider } from './contexts/WebSocketMessageQueue';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent /> 
      </AuthProvider>
    </Router>
  );
}

function AppContent() { 
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
        <WebSocketProvider playerId={playerId}> 
            <WebSocketMessageQueueProvider>
              <GameStateProvider>
                <div className="App">
          <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/how-to-play" element={<HowToPlay />} />
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
        </GameStateProvider>
        </WebSocketMessageQueueProvider>
        </WebSocketProvider>
      </DndProvider>
  );
}

export default App;
