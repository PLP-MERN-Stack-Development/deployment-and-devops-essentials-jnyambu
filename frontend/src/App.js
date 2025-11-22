import React, { useEffect, useState } from 'react';
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:10000';

export default function App() {
  const [test, setTest] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const t = await fetch(`${API_BASE}/api/test`);
        setTest(await t.json());
      } catch (e) {
        console.error('Error connecting to API:', e);
      }
      try {
        const h = await fetch(`${API_BASE}/health`);
        setHealth(await h.json());
      } catch (e) {
        console.error('Health check failed:', e);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Frontend</h1>
      <pre>Test: {JSON.stringify(test, null, 2)}</pre>
      <pre>Health: {JSON.stringify(health, null, 2)}</pre>
    </div>
  );
}