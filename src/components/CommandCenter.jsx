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
        <div className="header-left">
          <h1 className="glitch" data-text="INTEL HQ">INTEL HQ</h1>
          <p className="subtitle">STRATEGIC COMMAND / MAJOR STEELE [ADK-01]</p>
        </div>
        <button className="terminal-btn" onClick={onReturnToMenu}>RETURN TO BASE</button>
      </header>

      <div className="command-main">
        <section className="intel-terminal">
          <div className="terminal-header">COMMUNICATION UPLINK: SECURE</div>
          <div className="message-log" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                <span className="sender">{m.role === 'major' ? '[MAJOR STEELE]' : '[SOLDIER]'}</span>
                <p className="text">{m.text}</p>
              </div>
            ))}
            {loading && <div className="message major loading">ANALYZING ARCHIVES...</div>}
          </div>
          <form className="terminal-input" onSubmit={handleSend}>
            <span className="prompt">&gt;</span>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Query mission history or performance trends..."
              autoFocus
              disabled={loading}
            />
          </form>
        </section>

        <aside className="data-visuals">
          <div className="visual-box">
            <h3>MISSION TELEMETRY</h3>
            <div className="stat-row"><span>BIGQUERY LINK:</span> <span className="active">CONNECTED</span></div>
            <div className="stat-row"><span>DATA FLOW:</span> <span className="glitch-text">ENCRYPTED</span></div>
          </div>
          <div className="visual-box decorator">
            <div className="radar-grid"></div>
            <p className="tiny">SCANNING FOR TRENDS...</p>
          </div>
        </aside>
      </div>

      <style jsx>{`
        #command-center {
          background: #05080a;
          color: #4df;
          height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 2rem;
          font-family: 'Courier New', Courier, monospace;
          overflow: hidden;
        }
        .command-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #4df;
          padding-bottom: 1rem;
          margin-bottom: 2rem;
        }
        .intel-terminal {
          flex: 1;
          background: rgba(0, 20, 30, 0.8);
          border: 1px solid #4df;
          display: flex;
          flex-direction: column;
          border-radius: 4px;
          height: 70vh;
        }
        .terminal-header {
          background: #4df;
          color: #000;
          padding: 0.5rem 1rem;
          font-weight: bold;
          font-size: 0.8rem;
        }
        .message-log {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .message {
          max-width: 85%;
        }
        .message.user {
          align-self: flex-end;
          text-align: right;
        }
        .sender {
          font-weight: bold;
          font-size: 0.75rem;
          display: block;
          margin-bottom: 0.25rem;
          color: #4df8;
        }
        .text {
          font-size: 0.95rem;
          line-height: 1.4;
          background: rgba(77, 255, 255, 0.05);
          padding: 0.75rem 1rem;
          border-radius: 4px;
        }
        .message.major .text { border-left: 2px solid #4df; }
        .message.user .text { border-right: 2px solid #fff; color: #fff; }
        
        .terminal-input {
          display: flex;
          padding: 1rem;
          border-top: 1px solid #4df4;
          align-items: center;
          gap: 0.5rem;
        }
        .terminal-input input {
          flex: 1;
          background: transparent;
          border: none;
          color: #4df;
          font-family: inherit;
          font-size: 1rem;
          outline: none;
        }
        .command-main {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
          height: 100%;
        }
        .data-visuals {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .visual-box {
          background: rgba(0, 20, 30, 0.5);
          border: 1px solid #4df4;
          padding: 1rem;
          border-radius: 4px;
        }
        .stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }
        .active { color: #0f0; }
        .loading { animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

CommandCenter.propTypes = {
  onReturnToMenu: PropTypes.func.isRequired
};
