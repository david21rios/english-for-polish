// src/components/test/Timer.jsx

import { useEffect, useMemo, useRef } from "react";
import { FaClock, FaExclamationTriangle } from "react-icons/fa";

const formatTime = (secondsValue = 0) => {
  const safeSeconds = Math.max(Number(secondsValue) || 0, 0);

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
};

const Timer = ({ timeLeft, setTimeLeft, onTimeUp }) => {
  const hasFinished = useRef(false);

  useEffect(() => {
    if (timeLeft == null) return;

    if (timeLeft <= 0 && !hasFinished.current) {
      hasFinished.current = true;
      onTimeUp?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onTimeUp, setTimeLeft]);

  const isDanger = Number(timeLeft) <= 300;
  const isWarning = Number(timeLeft) <= 900 && Number(timeLeft) > 300;

  const timerState = useMemo(() => {
    if (isDanger) {
      return {
        container: "bg-red-50 border-red-200",
        iconBox: "bg-red-100 text-red-600",
        text: "text-red-600",
        label: "Kończy się czas",
        icon: <FaExclamationTriangle />
      };
    }

    if (isWarning) {
      return {
        container: "bg-yellow-50 border-yellow-200",
        iconBox: "bg-yellow-100 text-yellow-700",
        text: "text-yellow-700",
        label: "Pozostały czas",
        icon: <FaClock />
      };
    }

    return {
      container: "bg-white border-gray-200",
      iconBox: "bg-primary-100 text-primary-600",
      text: "text-gray-900",
      label: "Pozostały czas",
      icon: <FaClock />
    };
  }, [isDanger, isWarning]);

  return (
    <div className="sticky top-3 z-40 mb-4 md:mb-6">
      <div
        className={`mx-auto max-w-5xl rounded-2xl shadow-lg border px-4 py-3 md:px-5 md:py-4 transition-all duration-300 ${timerState.container}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${timerState.iconBox}`}
            >
              {timerState.icon}
            </div>

            <div className="min-w-0">
              <p className="text-[11px] md:text-xs uppercase tracking-wide text-gray-500 font-semibold">
                {timerState.label}
              </p>

              <p
                className={`text-2xl md:text-3xl font-black leading-tight ${timerState.text}`}
              >
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>

          <div className="hidden sm:block text-right">
            <p className="text-xs text-gray-500">
              Test zakończy się automatycznie po upływie czasu.
            </p>

            {isDanger && (
              <p className="text-xs font-semibold text-red-600 mt-1">
                Zostało mniej niż 5 minut.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timer;