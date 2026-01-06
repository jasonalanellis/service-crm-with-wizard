import { useEffect, useState, useCallback } from 'react';
import { Clock, LogOut } from 'lucide-react';

type Props = {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onTimeout: () => void;
  onExtend?: () => void;
};

export default function SessionTimeoutWarning({
  timeoutMinutes = 30,
  warningMinutes = 1,
  onTimeout,
  onExtend,
}: Props) {
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
    onExtend?.();
  }, [onExtend]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      if (!showWarning) setLastActivity(Date.now());
    };
    events.forEach(e => window.addEventListener(e, handleActivity));
    return () => events.forEach(e => window.removeEventListener(e, handleActivity));
  }, [showWarning]);

  useEffect(() => {
    const checkTimeout = setInterval(() => {
      const elapsed = (Date.now() - lastActivity) / 1000 / 60;
      const warningThreshold = timeoutMinutes - warningMinutes;

      if (elapsed >= timeoutMinutes) {
        onTimeout();
      } else if (elapsed >= warningThreshold && !showWarning) {
        setShowWarning(true);
        setCountdown(warningMinutes * 60);
      }
    }, 1000);

    return () => clearInterval(checkTimeout);
  }, [lastActivity, timeoutMinutes, warningMinutes, onTimeout, showWarning]);

  useEffect(() => {
    if (!showWarning) return;
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          onTimeout();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showWarning, onTimeout]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
          <Clock size={32} className="text-yellow-600 dark:text-yellow-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Session Expiring Soon</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          You will be logged out in <span className="font-bold text-yellow-600 dark:text-yellow-400">{countdown}</span> seconds due to inactivity.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onTimeout}
            className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
          >
            <LogOut size={16} /> Log Out
          </button>
          <button
            onClick={resetTimer}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
