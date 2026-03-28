import React, { useRef, useEffect, useState } from 'react';

export default function RexPanel({ messages, loading, lifelineUsed, gameOver, aiEnabled, onSendLifeline, onToggleAi }) {
  const messagesEndRef = useRef(null);
  const [showLifelineInput, setShowLifelineInput] = useState(false);
  const [lifelineValue, setLifelineValue] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLifelineClick = () => {
    if (lifelineUsed || gameOver) return;
    setShowLifelineInput(true);
  };

  const handleSendLifeline = async () => {
    if (!lifelineValue.trim()) return;
    const success = await onSendLifeline(lifelineValue.trim());
    if (success) {
      setShowLifelineInput(false);
      setLifelineValue('');
    } else {
      setLifelineValue('');
    }
  };

  return (
    <aside id="rex-panel">
      <div className="rex-header">
        <span className="blink-dot"></span>
        <span>COL. REX — RADIO COMMS</span>

        {/* ── AI Assist Toggle ──────────────────────────── */}
        <button
          id="ai-toggle-btn"
          className={`ai-toggle ${aiEnabled ? 'ai-toggle--on' : 'ai-toggle--off'}`}
          onClick={onToggleAi}
          title={aiEnabled ? 'Gemini AI Assist ON - click to disable' : 'Gemini AI Assist OFF - click to enable'}
          aria-pressed={aiEnabled}
        >
          <span className="ai-toggle-led"></span>
          <span className="ai-toggle-label">{aiEnabled ? 'Disable AI' : 'Enable AI'}</span>
        </button>
      </div>

      <div className="rex-messages" aria-live="polite" aria-atomic="false">
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={`rex-msg ${i === messages.length - 1 ? 'latest' : 'faded'}`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {loading && (
        <div className="rex-loading">
          <span className="loading-dots">...Colonel Rex is on the radio</span>
        </div>
      )}

      <div className="lifeline-container">
        {!showLifelineInput ? (
          <button
            className="btn-lifeline"
            onClick={handleLifelineClick}
            disabled={lifelineUsed || gameOver}
          >
            <span className="lifeline-icon">⚠</span>
            {lifelineUsed ? 'EMERGENCY RADIO — USED' : 'EMERGENCY RADIO (1x USE)'}
          </button>
        ) : (
          <div className="lifeline-input-area">
            <label htmlFor="lifeline-input">What's your intel request, soldier?</label>
            <div className="lifeline-input-row">
              <input
                type="text"
                id="lifeline-input"
                placeholder="e.g. B4"
                maxLength={4}
                autoComplete="off"
                value={lifelineValue}
                onChange={e => setLifelineValue(e.target.value.toUpperCase())}
                onKeyPress={e => { if (e.key === 'Enter') handleSendLifeline(); }}
                autoFocus
              />
              <button className="btn-send" onClick={handleSendLifeline}>SEND</button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
