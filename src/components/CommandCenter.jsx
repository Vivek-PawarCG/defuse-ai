import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Command Center Component.
 * The high-level intelligence office where Major Steele (ADK Agent) provides
 * strategic briefings based on BigQuery mission data.
 */
export default function CommandCenter({ onReturnToMenu }) {
  const [messages, setMessages] = useState([
    { role: 'major', text: 'Soldier, welcome to the Intelligence Office. I am Major Steele. I have analyzed your recent mission archives. What specific performance data do you require?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'major', text: data.response || 'Intelligence sync disrupted. Try again, soldier.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'major', text: 'CRITICAL ERROR: Connection to ADK Agent lost.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="command-center" className="screen active">
      <div className="scanline-overlay"></div>
      
      <header className="command-header">
        <div className="header-left" style={{ textAlign: 'left' }}>
          <h1 className="glitch title-defuse" data-text="INTEL HQ" style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)', letterSpacing: '0.2em', margin: 0 }}>INTEL HQ</h1>
          <p className="subtitle" style={{ margin: 0, fontSize: 'clamp(0.5rem, 2vw, 0.7rem)' }}>STRATEGIC COMMAND / MAJOR STEELE [UNIT-01]</p>
        </div>
        <div className="header-right">
          <button className="btn-military secondary-btn" onClick={onReturnToMenu} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>◀ RETURN TO BASE</button>
        </div>
      </header>

      <div className="command-main">
        <section className="intel-terminal">
          <div className="terminal-header">
            <span className="blink-dot"></span>
            COMMUNICATION UPLINK: SECURE
          </div>
          <div className="message-log" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                <span className="sender">{m.role === 'major' ? '[MAJOR STEELE]' : '[SOLDIER]'}</span>
                <p className="text">{m.text}</p>
              </div>
            ))}
            {loading && (
              <div className="message major loading">
                <span className="sender">[MAJOR STEELE]</span>
                <p className="text">ANALYZING ARCHIVES<span className="loading-dots">...</span></p>
              </div>
            )}
          </div>
          <form className="terminal-input" onSubmit={handleSend}>
            <span className="prompt">&gt;</span>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Query mission history..."
              autoFocus
              disabled={loading}
            />
            <button 
              type="submit" 
              className="btn-military" 
              disabled={loading || !input.trim()}
              style={{ fontSize: '0.7rem', padding: '0.4rem 1rem' }}
            >
              SEND
            </button>
          </form>
        </section>

        <aside className="data-visuals">
          <div className="visual-box">
            <h3 style={{ fontSize: '0.8rem', color: 'var(--green)', marginBottom: '0.5rem' }}>MISSION TELEMETRY</h3>
            <div className="stat-row"><span style={{ color: 'var(--text-dim)' }}>BIGQUERY LINK:</span> <span className="active" style={{ color: 'var(--green)' }}>● CONNECTED</span></div>
            <div className="stat-row"><span style={{ color: 'var(--text-dim)' }}>DATA FLOW:</span> <span className="glitch-text" style={{ color: 'var(--green-dim)' }}>ENCRYPTED</span></div>
          </div>
          <div className="visual-box radar-box">
            <div className="radar-grid" style={{ border: '1px solid var(--green-dark)', height: '100px', background: 'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0,255,65,0.05) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0,255,65,0.05) 20px)' }}></div>
            <p className="tiny" style={{ fontSize: '0.6rem', color: 'var(--green-dim)', marginTop: '0.5rem', textAlign: 'center' }}>SCANNING STRATEGIC TRENDS...</p>
          </div>
        </aside>
      </div>

      <style jsx>{`
        #command-center {
          background: var(--bg);
          color: var(--green);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          font-family: var(--font-mono);
          position: relative;
        }
        .command-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--green-dim);
          padding-bottom: 1rem;
          margin-bottom: 1.5rem;
          flex-shrink: 0;
        }
        .command-main {
          display: grid;
          grid-template-columns: 2.2fr 1fr;
          gap: 1.5rem;
          flex: 1;
          min-height: 0;
        }
        .intel-terminal {
          background: rgba(0, 255, 65, 0.02);
          border: 1px solid var(--green-dim);
          display: flex;
          flex-direction: column;
          border-radius: 4px;
          min-height: 400px;
        }
        .terminal-header {
          background: var(--green-dim);
          color: var(--bg);
          padding: 0.5rem 1rem;
          font-weight: bold;
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .message-log {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .message {
          max-width: 90%;
        }
        .message.user {
          align-self: flex-end;
          text-align: right;
        }
        .sender {
          font-weight: bold;
          font-size: 0.6rem;
          display: block;
          margin-bottom: 0.2rem;
          color: var(--green-dim);
          letter-spacing: 0.1em;
        }
        .text {
          font-size: 0.85rem;
          line-height: 1.5;
          background: rgba(0, 255, 65, 0.03);
          padding: 0.6rem 0.8rem;
          border-radius: 4px;
          color: var(--green);
          border: 1px solid rgba(0, 255, 65, 0.1);
        }
        .message.major .text { border-left: 2px solid var(--green); }
        .message.user .text { border-right: 2px solid var(--text-dim); color: var(--text); }
        
        .terminal-input {
          display: flex;
          padding: 0.8rem;
          border-top: 1px solid rgba(0, 255, 65, 0.1);
          align-items: center;
          gap: 0.5rem;
          background: rgba(0,0,0,0.3);
        }
        .terminal-input input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--green);
          font-family: inherit;
          font-size: 0.9rem;
          outline: none;
        }
        .data-visuals {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .visual-box {
          background: rgba(0, 255, 65, 0.02);
          border: 1px solid rgba(0, 255, 65, 0.1);
          padding: 1rem;
          border-radius: 4px;
        }
        .stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          margin-top: 0.4rem;
        }
        .loading { animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }

        @media (max-width: 768px) {
          #command-center {
            padding: 1rem;
            overflow-y: auto;
          }
          .command-header {
            flex-direction: row;
            align-items: center;
          }
          .command-main {
            grid-template-columns: 1fr;
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .intel-terminal {
            height: 60vh;
            min-height: 350px;
          }
          .radar-box {
            display: none;
          }
          .visual-box h3 {
            font-size: 0.7rem !important;
          }
        }
      `}</style>
    </div>
  );
}

CommandCenter.propTypes = {
  onReturnToMenu: PropTypes.func.isRequired
};
