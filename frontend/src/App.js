import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import GameRoom from './components/GameRoom';
import ActiveGameRoom from './components/ActiveGameRoom';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/play" element={<GameRoom />} />
          <Route path="/room/:roomId" element={<ActiveGameRoom />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
