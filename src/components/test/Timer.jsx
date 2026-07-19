// src/components/test/Timer.jsx

import {
  useEffect,
  useMemo,
  useRef
} from "react";

import PropTypes from "prop-types";

import {
  FaClock,
  FaExclamationTriangle
} from "react-icons/fa";

const DEFAULT_STORAGE_KEY =
  "cefr_placement_test_end_time";

const WARNING_THRESHOLD_SECONDS = 15 * 60;
const DANGER_THRESHOLD_SECONDS = 5 * 60;
const TIMER_INTERVAL_MS = 500;

const getSafeSeconds = (value = 0) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil(numericValue)
  );
};

const formatTime = (secondsValue = 0) => {
  const safeSeconds =
    getSafeSeconds(secondsValue);

  const hours =
    Math.floor(safeSeconds / 3600);

  const minutes =
    Math.floor(
      (safeSeconds % 3600) / 60
    );

  const seconds =
    safeSeconds % 60;

  return [
    hours,
    minutes,
    seconds
  ]
    .map((value) =>
      String(value).padStart(2, "0")
    )
    .join(":");
};

const getStoredEndTime = (
  storageKey
) => {
  try {
    const storedValue =
      window.sessionStorage.getItem(
        storageKey
      );

    if (!storedValue) {
      return null;
    }

    const parsedValue =
      Number(storedValue);

    if (
      !Number.isFinite(parsedValue) ||
      parsedValue <= 0
    ) {
      window.sessionStorage.removeItem(
        storageKey
      );

      return null;
    }

    return parsedValue;
  } catch (error) {
    console.warn(
      "Nie udało się odczytać czasu testu:",
      error
    );

    return null;
  }
};

const saveEndTime = (
  storageKey,
  endTime
) => {
  try {
    window.sessionStorage.setItem(
      storageKey,
      String(endTime)
    );
  } catch (error) {
    console.warn(
      "Nie udało się zapisać czasu testu:",
      error
    );
  }
};

export const clearStoredTestTimer = (
  storageKey = DEFAULT_STORAGE_KEY
) => {
  try {
    window.sessionStorage.removeItem(
      storageKey
    );
  } catch (error) {
    console.warn(
      "Nie udało się usunąć zapisanego czasu testu:",
      error
    );
  }
};

const Timer = ({
  timeLeft,
  setTimeLeft,
  onTimeUp,
  storageKey = DEFAULT_STORAGE_KEY
}) => {
  const endTimeRef = useRef(null);
  const hasInitializedRef =
    useRef(false);
  const hasFinishedRef =
    useRef(false);
  const intervalRef =
    useRef(null);
  const onTimeUpRef =
    useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current =
      onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (
      timeLeft === null ||
      timeLeft === undefined
    ) {
      return;
    }

    if (
      hasInitializedRef.current
    ) {
      return;
    }

    hasInitializedRef.current =
      true;

    const now = Date.now();

    const storedEndTime =
      getStoredEndTime(storageKey);

    if (
      storedEndTime &&
      storedEndTime > now
    ) {
      endTimeRef.current =
        storedEndTime;

      const restoredSeconds =
        getSafeSeconds(
          (storedEndTime - now) /
            1000
        );

      setTimeLeft(
        restoredSeconds
      );

      return;
    }

    if (storedEndTime) {
      clearStoredTestTimer(
        storageKey
      );
    }

    const initialSeconds =
      getSafeSeconds(timeLeft);

    const newEndTime =
      now +
      initialSeconds * 1000;

    endTimeRef.current =
      newEndTime;

    saveEndTime(
      storageKey,
      newEndTime
    );
  }, [
    setTimeLeft,
    storageKey,
    timeLeft
  ]);

  useEffect(() => {
    if (
      !hasInitializedRef.current ||
      !endTimeRef.current
    ) {
      return undefined;
    }

    const finishTimer = () => {
      if (
        hasFinishedRef.current
      ) {
        return;
      }

      hasFinishedRef.current =
        true;

      if (intervalRef.current) {
        window.clearInterval(
          intervalRef.current
        );

        intervalRef.current =
          null;
      }

      clearStoredTestTimer(
        storageKey
      );

      setTimeLeft(0);

      Promise.resolve(
        onTimeUpRef.current?.()
      ).catch((error) => {
        console.error(
          "Błąd podczas automatycznego zakończenia testu:",
          error
        );
      });
    };

    const synchronizeTimer = () => {
      const remainingMilliseconds =
        endTimeRef.current -
        Date.now();

      const remainingSeconds =
        getSafeSeconds(
          remainingMilliseconds /
            1000
        );

      setTimeLeft(
        remainingSeconds
      );

      if (
        remainingMilliseconds <= 0
      ) {
        finishTimer();
      }
    };

    synchronizeTimer();

    intervalRef.current =
      window.setInterval(
        synchronizeTimer,
        TIMER_INTERVAL_MS
      );

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          synchronizeTimer();
        }
      };

    const handleWindowFocus =
      () => {
        synchronizeTimer();
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "focus",
      handleWindowFocus
    );

    return () => {
      if (intervalRef.current) {
        window.clearInterval(
          intervalRef.current
        );

        intervalRef.current =
          null;
      }

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "focus",
        handleWindowFocus
      );
    };
  }, [
    setTimeLeft,
    storageKey
  ]);

  const safeTimeLeft =
    getSafeSeconds(timeLeft);

  const isDanger =
    safeTimeLeft <=
    DANGER_THRESHOLD_SECONDS;

  const isWarning =
    safeTimeLeft <=
      WARNING_THRESHOLD_SECONDS &&
    safeTimeLeft >
      DANGER_THRESHOLD_SECONDS;

  const timerState =
    useMemo(() => {
      if (isDanger) {
        return {
          container:
            "border-red-200 bg-red-50",

          iconBox:
            "bg-red-100 text-red-600",

          text:
            "text-red-600",

          label:
            "Kończy się czas",

          message:
            "Zostało mniej niż 5 minut.",

          Icon:
            FaExclamationTriangle
        };
      }

      if (isWarning) {
        return {
          container:
            "border-yellow-200 bg-yellow-50",

          iconBox:
            "bg-yellow-100 text-yellow-700",

          text:
            "text-yellow-700",

          label:
            "Pozostały czas",

          message:
            "Zostało mniej niż 15 minut.",

          Icon:
            FaClock
        };
      }

      return {
        container:
          "border-gray-200 bg-white",

        iconBox:
          "bg-primary-100 text-primary-600",

        text:
          "text-gray-900",

        label:
          "Pozostały czas",

        message:
          "Test zakończy się automatycznie po upływie czasu.",

        Icon:
          FaClock
      };
    }, [
      isDanger,
      isWarning
    ]);

  const TimerIcon =
    timerState.Icon;

  return (
    <div className="sticky top-3 z-40 mb-4 md:mb-6">
      <div
        className={`mx-auto max-w-5xl rounded-2xl border px-4 py-3 shadow-lg transition-all duration-300 md:px-5 md:py-4 ${timerState.container}`}
        role="timer"
        aria-live={
          isDanger
            ? "assertive"
            : "polite"
        }
        aria-label={`Pozostały czas testu: ${formatTime(
          safeTimeLeft
        )}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg md:h-11 md:w-11 ${timerState.iconBox}`}
            >
              <TimerIcon />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 md:text-xs">
                {timerState.label}
              </p>

              <p
                className={`text-2xl font-black leading-tight tabular-nums md:text-3xl ${timerState.text}`}
              >
                {formatTime(
                  safeTimeLeft
                )}
              </p>
            </div>
          </div>

          <div className="hidden text-right sm:block">
            <p
              className={`text-xs ${
                isDanger
                  ? "font-semibold text-red-600"
                  : isWarning
                    ? "font-semibold text-yellow-700"
                    : "text-gray-500"
              }`}
            >
              {timerState.message}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Odświeżenie strony nie
              resetuje czasu testu.
            </p>
          </div>
        </div>

        {(isWarning || isDanger) && (
          <div
            className={`mt-3 rounded-xl border px-3 py-2 text-xs sm:hidden ${
              isDanger
                ? "border-red-200 bg-red-100/50 text-red-700"
                : "border-yellow-200 bg-yellow-100/50 text-yellow-800"
            }`}
          >
            {timerState.message}
          </div>
        )}
      </div>
    </div>
  );
};

Timer.propTypes = {
  timeLeft:
    PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string
    ]),

  setTimeLeft:
    PropTypes.func.isRequired,

  onTimeUp:
    PropTypes.func.isRequired,

  storageKey:
    PropTypes.string
};

export default Timer;