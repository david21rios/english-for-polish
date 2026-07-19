// src/components/topics/player/MissionHeader.jsx

import {
  FaArrowLeft
} from "react-icons/fa";

const DIFFICULTY_LABELS = {
  easy: "Łatwa",
  medium: "Średnia",
  hard: "Trudna",
  adaptive: "Adaptacyjna"
};

const formatDifficulty = (
  difficulty = "easy"
) => {
  const normalizedDifficulty =
    String(
      difficulty || "easy"
    )
      .trim()
      .toLowerCase();

  return (
    DIFFICULTY_LABELS[
      normalizedDifficulty
    ] ||
    String(difficulty)
  );
};

const normalizePositiveInteger = (
  value,
  fallback
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

const MissionHeader = ({
  mission = {},
  onBack,
  disabled = false
}) => {
  const title =
    String(
      mission?.title ||
        "Misja konwersacyjna"
    ).trim();

  const description =
    String(
      mission?.description ||
        ""
    ).trim();

  const xpReward =
    normalizePositiveInteger(
      mission?.xpReward ??
        mission?.xp,
      10
    );

  const level =
    String(
      mission?.level ||
        "A1"
    ).trim();

  const difficulty =
    formatDifficulty(
      mission?.difficulty
    );

  return (
    <header className="bg-gradient-to-br from-primary-600 to-secondary-600 p-5 text-white md:p-8">
      <button
        type="button"
        onClick={onBack}
        disabled={disabled}
        className="mb-4 inline-flex items-center gap-2 text-sm text-white/90 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50 md:mb-6"
      >
        <FaArrowLeft />

        Powrót do misji
      </button>

      <div className="flex flex-col gap-5 md:gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-100 md:text-sm">
            Misja konwersacyjna z AI
          </p>

          <h1 className="mt-2 break-words text-2xl font-bold leading-tight md:text-4xl">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-3xl break-words text-sm leading-relaxed text-primary-50 md:text-base">
              {description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-3 lg:min-w-[300px]">
          <div className="rounded-2xl border border-white/10 bg-white/15 p-3 text-center md:p-4">
            <p className="text-lg font-bold md:text-2xl">
              {xpReward}
            </p>

            <p className="text-[10px] text-primary-100 md:text-xs">
              XP
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/15 p-3 text-center md:p-4">
            <p className="text-lg font-bold md:text-2xl">
              {level}
            </p>

            <p className="text-[10px] text-primary-100 md:text-xs">
              Poziom
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-white/10 bg-white/15 p-3 text-center md:p-4">
            <p
              className="truncate text-base font-bold md:text-lg"
              title={difficulty}
            >
              {difficulty}
            </p>

            <p className="text-[10px] text-primary-100 md:text-xs">
              Trudność
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MissionHeader;