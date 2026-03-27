import React, { useEffect, useRef, useState } from 'react';

export default function VictoryOverlay({ speech, title, stats, onNextMission, onReviewBoard }) {
  const canvasRef = useRef(null);
  const [showTitle, setShowTitle] = useState(false);

  // Confetti
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const emojis = ['💣', '🎖', '⭐', '🏅', '💥'];
    const particles = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: 1.5 + Math.random() * 3,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        size: 14 + Math.random() * 10,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 5,
      });
    }

    let frame;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (p.y < canvas.height + 50) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.font = `${p.size}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.emoji, 0, 0);
          ctx.restore();
        }
      });
      if (alive) frame = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Show title after speech
  useEffect(() => {
    if (title) {
      const t = setTimeout(() => setShowTitle(true), 500);
      return () => clearTimeout(t);
    }
  }, [title]);

  return (
    <div className="victory-overlay" style={{ display: 'flex' }}>
      <div className="victory-pulse"></div>
      <canvas ref={canvasRef} className="confetti-canvas"></canvas>
      <div className="victory-panel">
        <h1 className="stamp-cleared">FIELD CLEARED</h1>
        <div className="victory-speech">{speech}</div>
        {showTitle && (
          <div className="legendary-title" style={{ animation: 'stamp-in 0.5s ease-out' }}>
            {title}
          </div>
        )}
        <div className="victory-stats">{stats}</div>
        <div className="gameover-buttons">
          <button className="btn-military btn-gold" onClick={onNextMission}>▶ NEXT MISSION</button>
          <button className="btn-military btn-secondary" onClick={onReviewBoard}>👁 REVIEW BOARD</button>
        </div>
      </div>
    </div>
  );
}
