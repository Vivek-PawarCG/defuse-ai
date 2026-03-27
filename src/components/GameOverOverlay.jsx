import React from 'react';

export default function GameOverOverlay({ title, eulogy, stats, onRetry, onReviewBoard, onReturnToBase }) {
  return (
    <div className="gameover-overlay" style={{ display: 'flex' }}>
      <div className="gameover-panel">
        <h2 className="gameover-title">{title}</h2>
        <div className="gameover-eulogy">{eulogy}</div>
        <div className="gameover-stats">{stats}</div>
        <div className="gameover-buttons">
          <button className="btn-military" onClick={onRetry}>↻ TRY AGAIN</button>
          <button className="btn-military btn-secondary" onClick={onReviewBoard}>👁 REVIEW BOARD</button>
          <button className="btn-military btn-secondary" onClick={onReturnToBase}>◄ BASE</button>
        </div>
      </div>
    </div>
  );
}
