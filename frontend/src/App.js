import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
        setError('Failed to connect to backend');
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
          <p>Connecting to backend...</p>
        ) : error ? (
          <div>
            <p>❌ {error}</p>
            <p>Make sure backend is running on port 5000</p>
          </div>
        ) : (
          <div>
            <h2>✅ Backend Connected!</h2>
            <p>Message: {message}</p>
            
            {health && (
              <div>
                <p>Status: {health.status}</p>
                <p>Database: {health.database}</p>
                <p>Environment: {health.environment}</p>
              </div>
            )}
          </div>
        )}
        
        <p style={{marginTop: '30px', fontSize: '0.9rem'}}>
          API URL: {API_URL}
        </p>
      </header>
    </div>
  );
}

export default App;