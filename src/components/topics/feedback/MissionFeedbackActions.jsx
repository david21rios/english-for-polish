// src/components/topics/feedback/MissionFeedbackActions.jsx

import {
  FaArrowLeft,
  FaRedo
} from "react-icons/fa";

import {
  MISSION_FEEDBACK_VIEW_STATUS
} from "./missionFeedbackUtils";

const MissionFeedbackActions = ({
  status =
    MISSION_FEEDBACK_VIEW_STATUS.passed,

  onRetry,
  onBackToMissions,

  retryDisabled = false,
  backDisabled = false
}) => {
  const canRetry =
    typeof onRetry === "function";

  const canGoBack =
    typeof onBackToMissions ===
    "function";

  if (!canRetry && !canGoBack) {
    return null;
  }

  const retryLabel =
    status ===
    MISSION_FEEDBACK_VIEW_STATUS
      .failed
      ? "Spróbuj ponownie"
      : status ===
          MISSION_FEEDBACK_VIEW_STATUS
            .unavailable
        ? "Ponów próbę"
        : "Ćwicz ponownie";

  return (
    <section className="mt-6 flex flex-col justify-center gap-3 md:mt-10 md:gap-4 sm:flex-row">
      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retryDisabled}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 md:px-6"
        >
          <FaRedo />

          {retryLabel}
        </button>
      )}

      {canGoBack && (
        <button
          type="button"
          onClick={onBackToMissions}
          disabled={backDisabled}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 md:px-6"
        >
          <FaArrowLeft />

          Powrót do misji
        </button>
      )}
    </section>
  );
};

export default MissionFeedbackActions;