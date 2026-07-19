// src/components/topics/player/MissionFinishPanel.jsx

import {
  FaCheckCircle,
  FaFlagCheckered
} from "react-icons/fa";

/**
 * Returns the Polish grammatical label for
 * the remaining number of replies.
 *
 * @param {number} remainingReplies
 * @returns {string}
 */
const getRemainingReplyLabel = (
  remainingReplies
) => {
  const numericValue =
    Math.max(
      0,
      Math.round(
        Number(
          remainingReplies
        ) || 0
      )
    );

  if (numericValue === 1) {
    return "odpowiedzi";
  }

  return "odpowiedzi";
};

/**
 * Displays the final mission evaluation action.
 *
 * The action remains disabled until the student
 * reaches the minimum required number of replies.
 *
 * @param {{
 *   minimumReplyCountReached?: boolean,
 *   remainingReplies?: number,
 *   finishing?: boolean,
 *   disabled?: boolean,
 *   onFinish?: () => void
 * }} props
 * @returns {JSX.Element}
 */
const MissionFinishPanel = ({
  minimumReplyCountReached = false,
  remainingReplies = 0,
  finishing = false,
  disabled = false,
  onFinish
}) => {
  const actionDisabled =
    disabled ||
    finishing ||
    !minimumReplyCountReached;

  const normalizedRemainingReplies =
    Math.max(
      0,
      Math.round(
        Number(
          remainingReplies
        ) || 0
      )
    );

  /**
   * Requests the final mission evaluation.
   */
  const handleFinish = () => {
    if (
      actionDisabled ||
      typeof onFinish !==
        "function"
    ) {
      return;
    }

    onFinish();
  };

  return (
    <section className="mt-5 grid grid-cols-1 items-center gap-4 md:mt-6 md:grid-cols-[1fr_auto]">
      <div
        className="min-w-0 text-sm text-gray-600"
        aria-live="polite"
        aria-atomic="true"
      >
        {!minimumReplyCountReached ? (
          <div className="flex items-start gap-2">
            <FaFlagCheckered
              className="mt-0.5 shrink-0 text-primary-600"
              aria-hidden="true"
            />

            <p>
              Udziel jeszcze co najmniej{" "}
              <span className="font-semibold">
                {normalizedRemainingReplies}
              </span>{" "}
              {getRemainingReplyLabel(
                normalizedRemainingReplies
              )}.
            </p>
          </div>
        ) : finishing ? (
          <div className="flex items-start gap-2 text-primary-700">
            <span
              className="mt-0.5 inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary-200 border-t-primary-700"
              aria-hidden="true"
            />

            <p className="font-medium">
              Oceniamy wykonanie misji i przygotowujemy szczegółową
              informację zwrotną.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 font-medium text-green-700">
            <FaCheckCircle
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />

            <p>
              Minimalna liczba odpowiedzi została osiągnięta.
              Możesz zakończyć misję i otrzymać ocenę.
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleFinish}
        disabled={actionDisabled}
        aria-busy={finishing}
        className={`
          inline-flex
          min-w-[190px]
          items-center
          justify-center
          gap-2
          rounded-xl
          px-5
          py-3
          font-semibold
          transition-colors
          md:px-6
          ${
            !actionDisabled
              ? "bg-green-600 text-white hover:bg-green-700"
              : "cursor-not-allowed bg-gray-300 text-gray-500"
          }
        `}
      >
        <span
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center"
          aria-hidden="true"
        >
          {finishing ? (
            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <FaCheckCircle className="h-4 w-4" />
          )}
        </span>

        <span>
          {finishing
            ? "Ocenianie..."
            : "Ukończ misję"}
        </span>
      </button>
    </section>
  );
};

export default MissionFinishPanel;