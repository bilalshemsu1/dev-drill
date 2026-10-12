import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Editor from './pages/Editor';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import UpdatePrompt from './components/UpdatePrompt';

function GlobalShortcuts() {
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (e) => {
            const isMod = e.metaKey || e.ctrlKey;
            if (!isMod) return;

            if (e.key === '1') {
                e.preventDefault();
                navigate('/editor');
            } else if (e.key === '2') {
                e.preventDefault();
                navigate('/');
            } else if (e.key === '3') {
                e.preventDefault();
                navigate('/stats');
            } else if (e.key === ',') {
                e.preventDefault();
                navigate('/settings');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    return null;
}

function App() {
  return (
    <HashRouter>
      <GlobalShortcuts />
      <UpdatePrompt />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/problems" element={<Home />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
