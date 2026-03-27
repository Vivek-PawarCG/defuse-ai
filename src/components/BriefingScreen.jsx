import React, { useEffect, useRef, useState } from 'react';
import { callGeminiAPI } from '../utils/api.js';
import { PERSONALITIES } from '../utils/constants.js';

function Typewriter({ text, speed = 30, onComplete }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <span className={done ? '' : 'typewriter-cursor'}>{displayed}</span>;
}

export default function BriefingScreen({ onEnterField, apiReady, personality, speakRex }) {
  const [briefingText, setBriefingText] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transmissionAccepted, setTransmissionAccepted] = useState(false);
  const staticRef = useRef(null);
  const animRef = useRef(null);

  // Static animation
  useEffect(() => {
    const el = staticRef.current;
    if (!el) return;
    const chars = '░▒▓█ ';
    let mounted = true;

    function drawStatic() {
      if (!mounted) return;
      let html = '';
      for (let i = 0; i < 200; i++) {
        html += chars[Math.floor(Math.random() * chars.length)];
        if (Math.random() > 0.85) html += '<br>';
      }
      el.innerHTML = html;
      animRef.current = setTimeout(() => requestAnimationFrame(drawStatic), 100);
    }
    drawStatic();

    return () => {
      mounted = false;
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, []);

  // Fetch briefing from API
  useEffect(() => {
    const fetchBriefing = async () => {
      if (apiReady) {
        const prompt = `You are Colonel Rex, a grizzled bomb disposal instructor. Give a 3 sentence dramatic mission briefing to your rookie soldier. Mention the minefield, the stakes, and end with a warning. Military tone. No bullet points.`;
        const result = await callGeminiAPI(
          PERSONALITIES[personality] || PERSONALITIES['drill-sergeant'],
          [{ role: 'user', parts: [{ text: prompt }] }],
        );
        if (result) {
          setBriefingText(result);
          setLoading(false);
          return;
        }
      }
      setBriefingText("Listen up, soldier. You're about to walk into a nine-by-nine grid of pure hell — every step could be your last. The mines are buried deep and they don't care about your rank or your prayers. Keep your wits sharp, your hands steady, and for God's sake, don't rush it.");
      setLoading(false);
    };
    fetchBriefing();
  }, [apiReady, personality]);

  const handleAcceptTransmission = () => {
    setTransmissionAccepted(true);
    if (!loading && briefingText) {
      speakRex(briefingText, personality, true); // Force voice enabled for intro
    }
  };

  useEffect(() => {
    // If text finishes loading AFTER player accepts transmission
    if (transmissionAccepted && !loading && briefingText) {
       speakRex(briefingText, personality, true);
    }
  }, [loading, briefingText, transmissionAccepted, personality, speakRex]);

  return (
    <div id="briefing-screen" className="screen active">
      <div className="scanline-overlay"></div>
      <div className="static-canvas" ref={staticRef}></div>
      <div className="briefing-content">
        <h1 className="title-defuse">DEFUSE</h1>
        <p className="subtitle">BOMB DISPOSAL TRAINING — FIELD EXERCISE 7</p>
        <div className="briefing-box">
          <div className="briefing-header">
            <span className="blink-dot"></span>
            <span>INCOMING TRANSMISSION — COL. REX</span>
          </div>
          
          {!transmissionAccepted ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <button 
                className="btn-military btn-gold" 
                onClick={handleAcceptTransmission}
                style={{ fontSize: '0.9rem', padding: '0.6rem 1.5rem', animation: 'blink 2s infinite' }}
              >
                ACCEPT TRANSMISSION
              </button>
            </div>
          ) : (
            <p className="typewriter-text">
              {!loading ? (
                <Typewriter text={briefingText} speed={30} onComplete={() => setShowButton(true)} />
              ) : (
                <span className="typewriter-cursor">ESTABLISHING SECURE CONNECTION...</span>
              )}
            </p>
          )}

        </div>
        {showButton && (
          <button
            className="btn-military"
            onClick={() => {
              window.speechSynthesis.cancel();
              onEnterField();
            }}
            style={{ animation: 'stamp-in 0.3s ease-out' }}
          >
            ▶ ENTER THE FIELD
          </button>
        )}
      </div>
    </div>
  );
}
