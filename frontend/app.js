import React, { useState, useEffect } from 'react';
import './App.css';
import API_URL from './config/api';

function App() {
  const [message, setMessage] = useState('');
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Test API connection
    fetch(`${API_URL}/api/test`)
      .then(res => res.json())
      .then(data => {
        setMessage(data.message);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error connecting to API:', err);
        setError('Failed to connect to backend API');
        setLoading(false);
      });

    // Check backend health
    fetch(`${API_URL}/health`)
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => console.error('Health check failed:', err));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 MERN Stack Application</h1>
        <p>Week 7 - Deployment Assignment</p>
        
        {loading ? (
          <div className="loading">
            <p>Connecting to backend...</p>
          </div>
        ) : error ? (
          <div className="error">
            <p>❌ {error}</p>
            <p>Make sure backend is running on port 5000</p>
          </div>
        ) : (
          <div className="success">
            <h2>✅ Backend Connected!</h2>
            <p><strong>Message:</strong> {message}</p>
            
            {health && (
              <div className="health-info">
                <h3>Backend Health Status:</h3>
                <div className="health-details">
                  <p>🟢 Status: <strong>{health.status}</strong></p>
                  <p>💾 Database: <strong>{health.database}</strong></p>
                  <p>⚙️ Environment: <strong>{health.environment}</strong></p>
                  <p>⏱️ Uptime: <strong>{Math.floor(health.uptime)} seconds</strong></p>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="api-info">
          <p>API URL: {API_URL}</p>
        </div>
      </header>
    </div>
  );
}

export default App;