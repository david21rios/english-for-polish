// src/components/topics/player/MissionProgress.jsx

import {
  FaFlagCheckered
} from "react-icons/fa";

/**
 * Restricts a numeric value to the valid percentage range.
 *
 * @param {number} value
 * @returns {number}
 */
const clampPercentage = (
  value
) => {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        numericValue
      )
    )
  );
};

/**
 * Converts a value into a non-negative integer.
 *
 * @param {number} value
 * @param {number} fallback
 * @returns {number}
 */
const normalizeNonNegativeInteger = (
  value,
  fallback = 0
) => {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    ) ||
    numericValue < 0
  ) {
    return fallback;
  }

  return Math.round(
    numericValue
  );
};

/**
 * Displays the local conversation progress based on
 * the number of student replies.
 *
 * @param {{
 *   userMessagesCount?: number,
 *   minimumReplies?: number,
 *   progressPercent?: number | null
 * }} props
 * @returns {JSX.Element}
 */
const MissionProgress = ({
  userMessagesCount = 0,
  minimumReplies = 0,
  progressPercent = null
}) => {
  const normalizedUserMessages =
    normalizeNonNegativeInteger(
      userMessagesCount
    );

  const normalizedMinimumReplies =
    normalizeNonNegativeInteger(
      minimumReplies
    );

  const calculatedProgress =
    normalizedMinimumReplies > 0
      ? (
          normalizedUserMessages /
          normalizedMinimumReplies
        ) * 100
      : 0;

  const displayedProgress =
    progressPercent !== null &&
    progressPercent !== undefined
      ? clampPercentage(
          progressPercent
        )
      : clampPercentage(
          calculatedProgress
        );

  const minimumReached =
    normalizedMinimumReplies > 0 &&
    normalizedUserMessages >=
      normalizedMinimumReplies;

  return (
    <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 md:mb-6">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-gray-600 md:text-sm">
        <span className="font-medium">
          Postęp rozmowy
        </span>

        <span className="shrink-0">
          {normalizedUserMessages}
          {normalizedMinimumReplies > 0
            ? `/${normalizedMinimumReplies}`
            : ""}{" "}
          odpowiedzi
        </span>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={
          displayedProgress
        }
        aria-label="Postęp rozmowy w misji"
      >
        <div
          className={`
            h-2
            rounded-full
            transition-all
            duration-500
            ${
              minimumReached
                ? "bg-green-500"
                : "bg-primary-500"
            }
          `}
          style={{
            width: `${displayedProgress}%`
          }}
        />
      </div>

      <div className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-gray-500">
        <FaFlagCheckered
          className={`
            mt-0.5
            shrink-0
            ${
              minimumReached
                ? "text-green-600"
                : "text-primary-600"
            }
          `}
          aria-hidden="true"
        />

        {minimumReached ? (
          <span className="font-medium text-green-700">
            Minimalna liczba odpowiedzi została osiągnięta.
            Możesz zakończyć misję i otrzymać szczegółową ocenę.
          </span>
        ) : (
          <span>
            Liczba odpowiedzi wskazuje, kiedy można poprosić
            o końcową ocenę misji. Ostateczny wynik zależy również
            od jakości rozmowy i realizacji celów.
          </span>
        )}
      </div>
    </section>
  );
};

export default MissionProgress;