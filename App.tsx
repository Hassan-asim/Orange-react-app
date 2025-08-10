import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import LandingPage from './components/LandingPage';
import ChatApp from './components/ChatApp';
import OfflineIndicator from './components/OfflineIndicator';

const App: React.FC = () => {
  return (
    <>
      <OfflineIndicator />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatApp />} />
        </Routes>
      </Router>
    </>
  );
};

export default App;