import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <header style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1rem 0',
          marginBottom: '2rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div className="container">
            <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
              🎬 AI Video Generator
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
              Transform your scripts into animated stickman videos with AI
            </p>
          </div>
        </header>

        <main className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>

        <footer style={{
          textAlign: 'center',
          padding: '2rem 0',
          marginTop: '4rem',
          borderTop: '1px solid var(--border)',
          color: 'var(--text-secondary)'
        }}>
          <div className="container">
            <p>© 2024 AI Video Generator. Powered by Google Gemini & ElevenLabs</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;