import { useState, useRef, useCallback } from 'react';
import { callGeminiAPI } from '../utils/api.js';
import { PERSONALITIES } from '../utils/constants.js';

export function useRex() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const historyRef = useRef([]);
  const queueRef = useRef(Promise.resolve());

  const addMessage = useCallback((text, prompt) => {
    historyRef.current.push({ response: text, prompt: prompt || '' });
    setMessages(prev => [...prev, { text, id: Date.now() + Math.random() }]);
  }, []);

  const clearMessages = useCallback(() => {
    historyRef.current = [];
    setMessages([]);
  }, []);

  const callRex = useCallback(async (userMessage, personality, systemInstruction) => {
    const sysPrompt = systemInstruction || PERSONALITIES[personality] || PERSONALITIES['drill-sergeant'];

    const last3 = historyRef.current.slice(-3).map(m => [
      { role: 'user', parts: [{ text: m.prompt || '...' }] },
      { role: 'model', parts: [{ text: m.response }] },
    ]).flat();

    const contents = [
      ...last3,
      { role: 'user', parts: [{ text: userMessage }] },
    ];

    return new Promise((resolve) => {
      queueRef.current = queueRef.current.then(async () => {
        setLoading(true);
        const result = await callGeminiAPI(sysPrompt, contents);
        setLoading(false);
        resolve(result);
      });
    });
  }, []);

  return { messages, loading, addMessage, clearMessages, callRex };
}
