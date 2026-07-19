// src/components/topics/player/MissionInput.jsx

import {
  FaPaperPlane,
  FaSpinner
} from "react-icons/fa";

const MissionInput = ({
  value = "",
  onChange,
  onSubmit,
  validationMessage = "",
  disabled = false,
  sending = false,
  maximumCharacters = null
}) => {
  const normalizedValue =
    String(value || "");

  const hasMessage =
    normalizedValue.trim().length >
    0;

  const numericMaximum =
    Number(maximumCharacters);

  const hasCharacterLimit =
    Number.isFinite(
      numericMaximum
    ) &&
    numericMaximum > 0;

  const charactersRemaining =
    hasCharacterLimit
      ? Math.max(
          numericMaximum -
            normalizedValue.length,
          0
        )
      : null;

  const exceedsLimit =
    hasCharacterLimit &&
    normalizedValue.length >
      numericMaximum;

  const submitDisabled =
    disabled ||
    sending ||
    !hasMessage ||
    exceedsLimit;

  const handleChange = (
    event
  ) => {
    if (
      typeof onChange ===
      "function"
    ) {
      onChange(
        event.target.value
      );
    }
  };

  const handleKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (
        !submitDisabled &&
        typeof onSubmit ===
          "function"
      ) {
        onSubmit(event);
      }
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 md:mt-5"
    >
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="min-w-0 flex-1">
          <textarea
            rows="2"
            value={normalizedValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Napisz odpowiedź po angielsku. Skup się na komunikacji, nie na perfekcji..."
            disabled={
              disabled ||
              sending
            }
            aria-invalid={
              Boolean(
                validationMessage
              ) ||
              exceedsLimit
            }
            aria-describedby={
              validationMessage
                ? "mission-input-validation"
                : undefined
            }
            className={`w-full resize-none rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-500 md:text-base ${
              validationMessage ||
              exceedsLimit
                ? "border-yellow-300 focus:ring-yellow-400"
                : "border-gray-200 focus:ring-primary-500"
            }`}
          />

          {hasCharacterLimit && (
            <div
              className={`mt-1 text-right text-xs ${
                exceedsLimit
                  ? "font-semibold text-red-600"
                  : charactersRemaining <=
                      100
                    ? "text-yellow-700"
                    : "text-gray-400"
              }`}
            >
              {normalizedValue.length}/
              {numericMaximum}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={
            submitDisabled
          }
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition-colors md:px-6 ${
            !submitDisabled
              ? "bg-primary-600 text-white hover:bg-primary-700"
              : "cursor-not-allowed bg-gray-300 text-gray-500"
          }`}
        >
          {sending ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <FaPaperPlane />
          )}

          {sending
            ? "Wysyłanie..."
            : "Wyślij"}
        </button>
      </div>

      {validationMessage && (
        <div
          id="mission-input-validation"
          role="alert"
          className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800"
        >
          {validationMessage}
        </div>
      )}

      <p className="mt-2 text-xs leading-relaxed text-gray-500">
        Naciśnij Enter, aby wysłać. Użyj Shift + Enter, aby przejść do nowej
        linii.
      </p>
    </form>
  );
};

export default MissionInput;