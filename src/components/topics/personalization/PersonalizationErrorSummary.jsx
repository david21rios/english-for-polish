// src/components/topics/personalization/PersonalizationErrorSummary.jsx

import {
  FaExclamationTriangle,
  FaInfoCircle,
  FaRedo,
  FaTimes
} from "react-icons/fa";

const normalizeErrorItems = (
  errors = []
) => {
  if (!Array.isArray(errors)) {
    return [];
  }

  return errors
    .map(
      (
        error,
        index
      ) => {
        if (
          typeof error ===
          "string"
        ) {
          const message =
            error.trim();

          return message
            ? {
                id:
                  `error_${index + 1}`,
                field: "",
                message
              }
            : null;
        }

        if (
          !error ||
          typeof error !==
            "object"
        ) {
          return null;
        }

        const message =
          String(
            error.messagePolish ||
              error.message ||
              ""
          ).trim();

        if (!message) {
          return null;
        }

        return {
          id:
            String(
              error.code ||
                error.id ||
                `error_${index + 1}`
            ).trim(),

          field:
            String(
              error.field || ""
            ).trim(),

          message
        };
      }
    )
    .filter(Boolean);
};

const PersonalizationErrorSummary = ({
  title = "Sprawdź formularz",
  message = "",
  errors = [],
  warnings = [],

  type = "error",

  onRetry = null,
  onDismiss = null,

  retryLabel = "Spróbuj ponownie",
  retrying = false
}) => {
  const normalizedErrors =
    normalizeErrorItems(
      errors
    );

  const normalizedWarnings =
    normalizeErrorItems(
      warnings
    );

  const normalizedMessage =
    String(message || "")
      .normalize("NFKC")
      .trim();

  const hasContent =
    normalizedMessage ||
    normalizedErrors.length >
      0 ||
    normalizedWarnings.length >
      0;

  if (!hasContent) {
    return null;
  }

  const isError =
    type === "error" ||
    normalizedErrors.length >
      0;

  const containerClass =
    isError
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-yellow-200 bg-yellow-50 text-yellow-800";

  const Icon =
    isError
      ? FaExclamationTriangle
      : FaInfoCircle;

  const canRetry =
    typeof onRetry ===
    "function";

  const canDismiss =
    typeof onDismiss ===
    "function";

  return (
    <section
      role={
        isError
          ? "alert"
          : "status"
      }
      aria-live={
        isError
          ? "assertive"
          : "polite"
      }
      className={`mb-5 rounded-2xl border p-4 ${containerClass}`}
    >
      <div className="flex items-start gap-3">
        <Icon
          className="mt-0.5 shrink-0"
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">
                {title}
              </h2>

              {normalizedMessage && (
                <p className="mt-1 text-sm leading-relaxed">
                  {normalizedMessage}
                </p>
              )}
            </div>

            {canDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                disabled={retrying}
                className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Zamknij komunikat"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {normalizedErrors.length >
            0 && (
            <ul className="mt-3 space-y-2 text-sm">
              {normalizedErrors.map(
                (error) => (
                  <li
                    key={error.id}
                    className="flex items-start gap-2"
                  >
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current"
                      aria-hidden="true"
                    />

                    <span className="break-words leading-relaxed">
                      {error.message}
                    </span>
                  </li>
                )
              )}
            </ul>
          )}

          {normalizedWarnings.length >
            0 && (
            <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-100/60 p-3 text-yellow-900">
              <p className="text-xs font-semibold uppercase tracking-wide">
                Sugestie
              </p>

              <ul className="mt-2 space-y-2 text-sm">
                {normalizedWarnings.map(
                  (warning) => (
                    <li
                      key={warning.id}
                      className="flex items-start gap-2"
                    >
                      <FaInfoCircle className="mt-0.5 shrink-0" />

                      <span className="break-words leading-relaxed">
                        {
                          warning.message
                        }
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {canRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/70 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
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
        </div>
      </div>
    </section>
  );
};

export default PersonalizationErrorSummary;