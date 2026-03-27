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

  // Set standard briefing
  useEffect(() => {
    const briefings = [
      "Stay sharp soldier.. this field punishes mistakes. Every move you make decides whether you walk out or not.",
      "Steady now, soldier.. this field tests nerves, not strength. One calm breath at a time, and you'll make it through.",
      "Attention, soldier. You're entering a grid where precision isn't optional, it's survival. Maintain discipline and execute each move like your life depends on it."
    ];
    setBriefingText(briefings[Math.floor(Math.random() * briefings.length)]);
    setLoading(false);
  }, [personality]);

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
