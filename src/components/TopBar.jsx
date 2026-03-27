import React, { useState } from 'react';
import PropTypes from 'prop-types';
import FieldManual from './FieldManual.jsx';

const DIFF_KEYS = ['rookie', 'cadet', 'specialist', 'veteran', 'legend'];

export default function TopBar({
  minesRemaining, time, difficulty, personality, voiceEnabled, heatmapEnabled, gameOver,
  onSwitchDifficulty, onSwitchPersonality, onToggleVoice, onToggleHeatmap, onAutoSolve, onSurrender,
  onShowLeaderboard,
}) {
  const [showManual, setShowManual] = useState(false);

  return (
    <>
      <header id="top-bar">
        <div className="top-bar-left">
          <div className="stat-box" id="mine-counter">
            <span className="stat-label">MINES</span>
            <span className="stat-value">{String(minesRemaining).padStart(2, '0')}</span>
          </div>
          <div className="stat-box" id="timer-box">
            <span className="stat-label">TIME</span>
            <span className="stat-value">{String(time).padStart(3, '0')}</span>
          </div>
        </div>

        <div className="top-bar-center">
          <span className="game-title-small">DEFUSE</span>
        </div>

        <div className="top-bar-right">
          <div className="difficulty-selector">
            {DIFF_KEYS.map(key => (
              <button
                key={key}
                className={`diff-btn ${difficulty === key ? 'active' : ''}`}
                onClick={() => onSwitchDifficulty(key)}
              >
                {key.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="ai-controls">
            <select
              className="rex-select"
              value={personality}
              onChange={e => onSwitchPersonality(e.target.value)}
              title="Rex Personality"
            >
              <option value="drill-sergeant">Drill Sergeant</option>
              <option value="mentor">Mentor</option>
              <option value="comedian">Comedian</option>
            </select>
            <button
              className="btn-settings"
              onClick={onToggleVoice}
              title={voiceEnabled ? 'Toggle Voice (Loud)' : 'Toggle Voice (Muted)'}
            >
              {voiceEnabled ? '🔊' : '🔇'}
            </button>
            <button className="btn-settings btn-solve" onClick={onAutoSolve} title="AI Auto-Solver">
              🤖 SOLVE
            </button>
            <button
              className={`btn-settings btn-heatmap ${heatmapEnabled ? 'active' : ''}`}
              onClick={onToggleHeatmap}
              title="Toggle Mine Probability Heatmap"
            >
              🌡 HEAT
            </button>
            <button
              className={`btn-settings btn-surrender ${gameOver ? 'btn-gold' : ''}`}
              onClick={onSurrender}
              title={gameOver ? 'New Game' : 'Surrender Mission'}
            >
              {gameOver ? '↻ NEW GAME' : '☠ SURRENDER'}
            </button>
          </div>
          
          <button className="btn-settings" onClick={onShowLeaderboard} title="View Global Hall of Fame">
            🏆
          </button>

          <button className="btn-settings" onClick={() => setShowManual(true)} title="Field Manual / How to Play">
            ?
          </button>
        </div>
      </header>

      {showManual && <FieldManual onClose={() => setShowManual(false)} />}
    </>
  );
}

TopBar.propTypes = {
  minesRemaining: PropTypes.number.isRequired,
  time: PropTypes.number.isRequired,
  difficulty: PropTypes.string.isRequired,
  personality: PropTypes.string.isRequired,
  voiceEnabled: PropTypes.bool.isRequired,
  heatmapEnabled: PropTypes.bool.isRequired,
  gameOver: PropTypes.bool.isRequired,
  onSwitchDifficulty: PropTypes.func.isRequired,
  onSwitchPersonality: PropTypes.func.isRequired,
  onToggleVoice: PropTypes.func.isRequired,
  onToggleHeatmap: PropTypes.func.isRequired,
  onAutoSolve: PropTypes.func.isRequired,
  onSurrender: PropTypes.func.isRequired,
  onShowLeaderboard: PropTypes.func.isRequired,
};
