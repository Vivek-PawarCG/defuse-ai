import React, { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../utils/firebase.js';

export default function LeaderboardOverlay({ difficulty, onClose }) {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchLeaderboard(difficulty);
        setScores(data);
        if (data.length === 0) {
          setError('No records found for this difficulty level. Become the first legend.');
        }
      } catch (err) {
        setError('Failed to establish secure connection to Central Command DB.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [difficulty]);

  return (
    <div className="overlay scale-in">
      <div className="overlay-backdrop" onClick={onClose}></div>
      <div className="victory-panel leaderboard-panel" style={{ zIndex: 10 }}>
        <h2 className="gameover-title" style={{ color: 'var(--green)' }}>HALL OF FAME</h2>
        <p className="subtitle" style={{ textAlign: 'center', margin: '0 0 1rem 0' }}>CURRENT CLASSIFICATION: {difficulty.toUpperCase()}</p>
        
        {loading ? (
          <div className="rex-loading" style={{ margin: '2rem 0', textAlign: 'center' }}>
            <span className="loading-dots">Decrypting secure archives</span>
          </div>
        ) : error && scores.length === 0 ? (
          <p className="gameover-eulogy" style={{ textAlign: 'center' }}>{error}</p>
        ) : (
          <div className="leaderboard-table">
            <div className="lb-header">
              <span>RANK</span>
              <span>SOLDIER</span>
              <span>TILES</span>
              <span>TIME</span>
            </div>
            <div className="lb-body">
              {scores.map((s, index) => (
                <div key={s.id} className="lb-row">
                  <span className="lb-rank">#{index + 1}</span>
                  <span className="lb-name">{s.username}</span>
                  <span className="lb-score">{s.score}</span>
                  <span className="lb-time">{s.time}s</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="gameover-buttons" style={{ marginTop: '2rem' }}>
          <button className="btn-military btn-red" onClick={onClose}>
            RETURN TO BASE
          </button>
        </div>
      </div>
    </div>
  );
}
