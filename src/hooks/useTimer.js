import { useState, useRef, useCallback } from 'react';

export function useTimer() {
  const [time, setTime] = useState(0);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setTime(0);
    intervalRef.current = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setTime(0);
  }, [stop]);

  return { time, start, stop, reset };
}
