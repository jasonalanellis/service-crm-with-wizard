import { useState, useCallback, useRef } from 'react';

type UndoAction = {
  description: string;
  undo: () => Promise<void>;
};

export function useUndoAction() {
  const [pendingUndo, setPendingUndo] = useState<UndoAction | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const startUndoTimer = useCallback((action: UndoAction, seconds: number = 5) => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setPendingUndo(action);
    setCountdown(seconds);

    // Start countdown
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    // Auto-clear after timeout
    timeoutRef.current = setTimeout(() => {
      setPendingUndo(null);
      setCountdown(5);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }, seconds * 1000);
  }, []);

  const executeUndo = useCallback(async () => {
    if (!pendingUndo) return;
    
    // Clear timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    try {
      await pendingUndo.undo();
    } finally {
      setPendingUndo(null);
      setCountdown(5);
    }
  }, [pendingUndo]);

  const cancelUndo = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setPendingUndo(null);
    setCountdown(5);
  }, []);

  return {
    pendingUndo,
    countdown,
    startUndoTimer,
    executeUndo,
    cancelUndo,
  };
}
