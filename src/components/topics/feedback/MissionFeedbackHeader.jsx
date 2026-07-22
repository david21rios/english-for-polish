// src/components/topics/feedback/MissionFeedbackHeader.jsx

import {
  FaClock,
  FaExclamationTriangle,
  FaRedo,
  FaSearch,
  FaStar,
  FaTrophy
} from "react-icons/fa";

import {
  MISSION_FEEDBACK_VIEW_STATUS,
  clampFeedbackNumber
} from "./missionFeedbackUtils";

/*
|--------------------------------------------------------------------------
| Stars
|--------------------------------------------------------------------------
*/

const renderStars = (
  stars = 0
) => {
  const safeStars =
    clampFeedbackNumber(
      stars,
      {
        minimum: 0,
        maximum: 5,
        fallback: 0
      }
    );

  return Array.from({
    length: 5
  }).map((_, index) => (
    <FaStar
      key={index}
      className={
        index < safeStars
          ? "text-yellow-300"
          : "text-white/30"
      }
      aria-hidden="true"
    />
  ));
};

/*
|--------------------------------------------------------------------------
| Status icon
|--------------------------------------------------------------------------
*/

const StatusIcon = ({
  iconType
}) => {
  const icons = {
    trophy: FaTrophy,
    retry: FaRedo,
    clock: FaClock,
    review: FaSearch,
    warning:
      FaExclamationTriangle
  };

  const Icon =
    icons[iconType] ||
    FaTrophy;

  return <Icon />;
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const MissionFeedbackHeader = ({
  status =
    MISSION_FEEDBACK_VIEW_STATUS
      .passed,

  eyebrow =
    "Misja ukończona",

  title =
    "Świetna robota!",

  description = "",

  gradientClass =
    "from-green-600 to-primary-600",

  accentClass =
    "text-green-100",

  iconType = "trophy",

  score = 0,
  stars = 0,

  xpEarned = 0,
  totalXp = 0,

  alreadyCompleted = false
}) => {
  const isFinalPassed = [
    MISSION_FEEDBACK_VIEW_STATUS
      .passed,
    MISSION_FEEDBACK_VIEW_STATUS
      .good,
    MISSION_FEEDBACK_VIEW_STATUS
      .excellent
  ].includes(status);

  const xpLabel =
    alreadyCompleted
      ? "Już ukończona"
      : isFinalPassed
        ? "Zdobyte XP"
        : "XP oczekujące";

  return (
    <header
      className={`bg-gradient-to-br ${gradientClass} p-5 text-center text-white md:p-8`}
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/20 text-3xl md:mb-6 md:h-24 md:w-24 md:text-5xl">
        <StatusIcon
          iconType={iconType}
        />
      </div>

      <p
        className={`text-xs font-semibold uppercase tracking-wide md:text-sm ${accentClass}`}
      >
        {eyebrow}
      </p>

      <h1 className="mt-2 text-2xl font-bold md:text-4xl">
        {title}
      </h1>

      {stars > 0 && (
        <div
          className="mt-4 flex justify-center gap-1 text-2xl"
          aria-label={`${stars} z 5 gwiazdek`}
        >
          {renderStars(stars)}
        </div>
      )}

      {stars === 0 &&
        !isFinalPassed && (
          <p className="mt-4 text-sm font-medium text-white/80">
            Gwiazdki nie zostały jeszcze przyznane.
          </p>
        )}

      {description && (
        <p
          className={`mx-auto mt-3 max-w-2xl text-sm leading-relaxed md:text-base ${accentClass}`}
        >
          {description}
        </p>
      )}

      <div className="mx-auto mt-5 grid max-w-2xl grid-cols-3 gap-3 md:mt-8">
        <div className="rounded-2xl border border-white/10 bg-white/15 px-3 py-3 md:px-6 md:py-4">
          <div className="text-xl font-bold md:text-2xl">
            {score}%
          </div>

          <p
            className={`mt-1 text-xs md:text-sm ${accentClass}`}
          >
            Wynik
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/15 px-3 py-3 md:px-6 md:py-4">
          <div className="inline-flex items-center justify-center gap-2 text-xl font-bold md:text-2xl">
            <FaStar />

            +{xpEarned}
          </div>

          <p
            className={`mt-1 text-xs md:text-sm ${accentClass}`}
          >
            {xpLabel}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/15 px-3 py-3 md:px-6 md:py-4">
          <div className="text-xl font-bold md:text-2xl">
            {totalXp}
          </div>

          <p
            className={`mt-1 text-xs md:text-sm ${accentClass}`}
          >
            XP tematu
          </p>
        </div>
      </div>
    </header>
  );
};

export default MissionFeedbackHeader;
