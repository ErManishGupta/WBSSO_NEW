import React, { useEffect, useState } from 'react';
import { Button } from '@wb-sso/ui';
import { AlertTriangle, Clock } from 'lucide-react';

interface SessionTimeoutModalProps {
  onLogout: () => void;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({ onLogout }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  const WARNING_THRESHOLD_MS = 14 * 60 * 1000; // 14 mins
  const TIMEOUT_MS = 15 * 60 * 1000; // 15 mins

  useEffect(() => {
    let lastActivity = Date.now();
    let warningTimer: any;
    let logoutTimer: any;

    const resetTimers = () => {
      lastActivity = Date.now();
      if (showWarning) setShowWarning(false);
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);

      warningTimer = setTimeout(() => {
        setShowWarning(true);
        setSecondsRemaining(60);
      }, WARNING_THRESHOLD_MS);

      logoutTimer = setTimeout(() => {
        onLogout();
      }, TIMEOUT_MS);
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) =>
      window.addEventListener(event, resetTimers, { passive: true })
    );

    resetTimers();

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      activityEvents.forEach((event) => window.removeEventListener(event, resetTimers));
    };
  }, [onLogout, showWarning]);

  useEffect(() => {
    let interval: any;
    if (showWarning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (showWarning && secondsRemaining <= 0) {
      onLogout();
    }
    return () => clearInterval(interval);
  }, [showWarning, secondsRemaining, onLogout]);

  if (!showWarning) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#D9DFEA]">
        <div className="flex items-center gap-3 text-[#B54708] mb-3">
          <AlertTriangle size={28} />
          <h2 id="session-warning-title" className="text-lg font-bold text-[#101828] m-0">
            Session Expiring Soon
          </h2>
        </div>
        <p className="text-sm text-[#475467] leading-relaxed mb-4">
          For your security, your authenticated session will expire due to 15 minutes of inactivity.
        </p>
        <div className="bg-[#FFFAEB] border border-[#B54708]/30 rounded-lg p-3 flex items-center gap-2.5 text-[#B54708] text-sm font-semibold mb-6">
          <Clock size={18} />
          <span>Signing out in {secondsRemaining} seconds...</span>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onLogout}>
            Sign Out Now
          </Button>
          <Button variant="primary" onClick={() => setShowWarning(false)}>
            Stay Signed In
          </Button>
        </div>
      </div>
    </div>
  );
};
