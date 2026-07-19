// src/components/topics/player/MissionWarnings.jsx

import {
  FaExclamationTriangle,
  FaInfoCircle,
  FaRedo,
  FaTimesCircle
} from "react-icons/fa";

const WARNING_TYPES = {
  warning: {
    icon: FaExclamationTriangle,
    containerClass:
      "border-yellow-200 bg-yellow-50 text-yellow-800",
    buttonClass:
      "text-yellow-900 hover:bg-yellow-100"
  },

  error: {
    icon: FaTimesCircle,
    containerClass:
      "border-red-200 bg-red-50 text-red-800",
    buttonClass:
      "text-red-900 hover:bg-red-100"
  },

  info: {
    icon: FaInfoCircle,
    containerClass:
      "border-blue-200 bg-blue-50 text-blue-800",
    buttonClass:
      "text-blue-900 hover:bg-blue-100"
  }
};

const normalizeMessage = (
  value = ""
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim();
};

const MissionWarnings = ({
  message = "",
  type = "warning",
  title = "",
  retryLabel = "Spróbuj ponownie",
  onRetry = null,
  onDismiss = null,
  retrying = false
}) => {
  const normalizedMessage =
    normalizeMessage(message);

  if (!normalizedMessage) {
    return null;
  }

  const configuration =
    WARNING_TYPES[type] ||
    WARNING_TYPES.warning;

  const WarningIcon =
    configuration.icon;

  const normalizedTitle =
    normalizeMessage(title);

  const canRetry =
    typeof onRetry ===
    "function";

  const canDismiss =
    typeof onDismiss ===
    "function";

  return (
    <section
      role={
        type === "error"
          ? "alert"
          : "status"
      }
      className={`mb-5 rounded-2xl border px-4 py-3 ${configuration.containerClass}`}
    >
      <div className="flex items-start gap-3">
        <WarningIcon
          className="mt-0.5 shrink-0"
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1">
          {normalizedTitle && (
            <p className="font-semibold">
              {normalizedTitle}
            </p>
          )}

          <p
            className={`break-words text-sm leading-relaxed ${
              normalizedTitle
                ? "mt-1"
                : ""
            }`}
          >
            {normalizedMessage}
          </p>

          {(canRetry ||
            canDismiss) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {canRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={retrying}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${configuration.buttonClass}`}
                >
                  <FaRedo
                    className={
                      retrying
                        ? "animate-spin"
                        : ""
                    }
                  />

                  {retrying
                    ? "Ponawianie..."
                    : retryLabel}
                </button>
              )}

              {canDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  disabled={retrying}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${configuration.buttonClass}`}
                >
                  Zamknij
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MissionWarnings;