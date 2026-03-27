import { useRef, useCallback } from 'react';

export function useAudio() {
  const ctxRef = useRef(null);
  const synthVoiceRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const playSound = useCallback((type) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;

    switch (type) {
      case 'click':
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
        break;
      case 'flag':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.linearRampToValueAtTime(1400, t + 0.1);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
        break;
      case 'explosion': {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 1.5);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
        osc.start(t); osc.stop(t + 1.5);
        // Drone
        const dOsc = ctx.createOscillator();
        const dGain = ctx.createGain();
        dOsc.type = 'sine';
        dOsc.frequency.setValueAtTime(50, t);
        dGain.gain.setValueAtTime(0.1, t);
        dGain.gain.linearRampToValueAtTime(0, t + 3);
        dOsc.connect(dGain); dGain.connect(ctx.destination);
        dOsc.start(); dOsc.stop(t + 3);
        break;
      }
      case 'victory':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.setValueAtTime(600, t + 0.1);
        osc.frequency.setValueAtTime(800, t + 0.2);
        osc.frequency.setValueAtTime(1200, t + 0.3);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.8);
        osc.start(t); osc.stop(t + 0.8);
        break;
    }
  }, [getCtx]);

  const playStaticCrackle = useCallback(() => {
    try {
      const ctx = getCtx();
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
      const source = ctx.createBufferSource();
      const g = ctx.createGain();
      source.buffer = buffer;
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      source.connect(g).connect(ctx.destination);
      source.start();
    } catch (e) { /* ignore */ }
  }, [getCtx]);

  const loadVoices = useCallback(() => {
    const voices = speechSynthesis.getVoices();
    synthVoiceRef.current = voices.find(v => v.name.includes('Google UK English Male')) ||
      voices.find(v => v.name.includes('Male') && v.lang.includes('en')) ||
      voices.find(v => v.lang.includes('en-GB')) ||
      voices.find(v => v.lang.includes('en')) ||
      voices[0];
  }, []);

  const speakRex = useCallback((text, personality, voiceEnabled) => {
    if (!voiceEnabled) return;
    speechSynthesis.cancel();
    const cleanText = text.replace(/\*\*/g, '').replace(/_/g, '').replace(/[⚠💥✓✗]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (synthVoiceRef.current) utterance.voice = synthVoiceRef.current;

    if (personality === 'drill-sergeant') {
      utterance.pitch = 0.6; utterance.rate = 1.1;
    } else if (personality === 'mentor') {
      utterance.pitch = 0.9; utterance.rate = 0.9;
    } else {
      utterance.pitch = 1.2; utterance.rate = 1.05;
    }
    speechSynthesis.speak(utterance);
  }, []);

  return { playSound, playStaticCrackle, loadVoices, speakRex };
}
