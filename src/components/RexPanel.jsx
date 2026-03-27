import React, { useRef, useEffect, useState } from 'react';

export default function RexPanel({ messages, loading, lifelineUsed, gameOver, onSendLifeline, onOpenCommandCenter }) {
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

      <div className="lifeline-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {!showLifelineInput ? (
          <button
            className="btn-lifeline"
            onClick={handleLifelineClick}
            disabled={lifelineUsed || gameOver}
            style={{ width: '100%', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span className="lifeline-icon" style={{ marginRight: '0.5rem' }}>⚠</span>
            {lifelineUsed ? 'EMERGENCY RADIO — USED' : 'EMERGENCY RADIO (1x USE)'}
          </button>
        ) : (
          <div className="lifeline-input-area" style={{ display: 'block' }}>
            <label htmlFor="lifeline-input" style={{ fontSize: '0.65rem', marginBottom: '0.3rem', display: 'block', color: 'var(--text-dim)' }}>What's your intel request, soldier?</label>
            <div className="lifeline-input-row" style={{ display: 'flex', gap: '0.4rem' }}>
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
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid var(--green-dim)', color: 'var(--green)', fontSize: '0.8rem', padding: '0.3rem' }}
              />
              <button className="btn-send" onClick={handleSendLifeline} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>SEND</button>
            </div>
          </div>
        )}

        {/* Command Center Access - Major Steele */}
        <button
          className="btn-military secondary-btn"
          onClick={onOpenCommandCenter}
          style={{ width: '100%', fontSize: '0.75rem', padding: '0.6rem', borderColor: 'var(--green-dim)' }}
        >
          <span style={{ marginRight: '0.5rem' }}>📊</span>
          INTEL HQ (COMMAND CENTER)
        </button>
      </div>
    </aside>
  );
}
