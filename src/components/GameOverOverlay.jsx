import React from 'react';

export default function GameOverOverlay({ title, eulogy, stats, strategicDebrief, onRetry, onReviewBoard, onReturnToBase }) {
  return (
    <div className="gameover-overlay" style={{ display: 'flex' }}>
      <div className="gameover-panel">
        <h2 className="gameover-title">{title}</h2>
        <div className="gameover-eulogy">{eulogy}</div>
        <div className="gameover-stats">{stats}</div>

        {/* ── Strategic Debrief (Vertex AI + BigQuery) ────────── */}
        <div className="strategic-debrief">
          <div className="debrief-header">
            <span className="blink-dot" style={{ width: 6, height: 6 }}></span>
            STRATEGIC DEBRIEF — MAJ. STEELE
          </div>
          <div className="debrief-body">
            {strategicDebrief === undefined || strategicDebrief === null
              ? <span className="debrief-loading">Analyzing mission archives<span className="loading-dots">...</span></span>
              : strategicDebrief === ''
                ? <span className="debrief-na">Archives unavailable for this mission.</span>
                : strategicDebrief
            }
          </div>
        </div>

        <div className="gameover-buttons">
          <button className="btn-military" onClick={onRetry}>↻ TRY AGAIN</button>
          <button className="btn-military btn-secondary" onClick={onReviewBoard}>👁 REVIEW BOARD</button>
          <button className="btn-military btn-secondary" onClick={onReturnToBase}>◄ BASE</button>
        </div>
      </div>
    </div>
  );
}

