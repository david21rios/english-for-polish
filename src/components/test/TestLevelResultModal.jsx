// src/components/test/TestLevelResultModal.jsx

import PropTypes from "prop-types";

import {
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaSpinner
} from "react-icons/fa";

const MIN_SCORE_TO_PASS = 70;

const clampScore = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(numericValue))
  );
};

const formatScore = (value) => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }

  return `${clampScore(value)}%`;
};

const getWritingStatusMessage = (
  writingEvaluation = {}
) => {
  const status =
    writingEvaluation.status || "";

  const requiresManualReview =
    writingEvaluation.requiresManualReview === true ||
    writingEvaluation.requiresReview === true;

  const isFinal =
    writingEvaluation.isFinal === true &&
    !requiresManualReview;

  if (isFinal) {
    return {
      type: "final",

      title:
        "Ocena pisania została zakończona",

      description:
        "Odpowiedzi pisemne zostały ocenione automatycznie zgodnie z kryteriami CEFR."
    };
  }

  if (
    status === "invalid"
  ) {
    return {
      type: "warning",

      title:
        "Nie można było w pełni ocenić odpowiedzi pisemnej",

      description:
        "Co najmniej jedna odpowiedź była pusta, zbyt krótka lub nie zawierała wystarczającej ilości zrozumiałego tekstu. Wynik wymaga dodatkowej weryfikacji."
    };
  }

  if (
    status === "partially_evaluated"
  ) {
    return {
      type: "pending",

      title:
        "Ocena pisania została wykonana częściowo",

      description:
        "Niektóre odpowiedzi zostały ocenione automatycznie, a pozostałe oczekują na ponowną ocenę lub weryfikację nauczyciela."
    };
  }

  if (
    status === "unavailable"
  ) {
    return {
      type: "pending",

      title:
        "Automatyczna ocena pisania jest chwilowo niedostępna",

      description:
        "Odpowiedzi zostały zapisane. Wyświetlony wynik jest tymczasowy i może zostać później zaktualizowany."
    };
  }

  if (
    status === "estimated" ||
    requiresManualReview
  ) {
    return {
      type: "estimated",

      title:
        "Wynik pisania jest obecnie szacowany",

      description:
        "Odpowiedzi zostały zapisane. Dokładna ocena zostanie wykonana automatycznie lub przez nauczyciela."
    };
  }

  return null;
};

const getStatusClasses = (
  statusType
) => {
  if (statusType === "final") {
    return {
      container:
        "border-green-200 bg-green-50 text-green-800",

      icon:
        "text-green-700"
    };
  }

  if (statusType === "warning") {
    return {
      container:
        "border-orange-200 bg-orange-50 text-orange-800",

      icon:
        "text-orange-700"
    };
  }

  if (statusType === "estimated") {
    return {
      container:
        "border-yellow-200 bg-yellow-50 text-yellow-800",

      icon:
        "text-yellow-700"
    };
  }

  return {
    container:
      "border-blue-200 bg-blue-50 text-blue-800",

    icon:
      "text-blue-700"
  };
};

const ScoreRow = ({
  label,
  score,
  weight,
  isEstimated = false
}) => {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
      <div>
        <span className="font-medium text-gray-700">
          {label}
        </span>

        {typeof weight === "number" && (
          <p className="mt-1 text-xs text-gray-500">
            Waga w wyniku poziomu:{" "}
            {Math.round(weight * 100)}%
          </p>
        )}

        {isEstimated && (
          <p className="mt-1 text-xs font-medium text-yellow-700">
            Wynik tymczasowy
          </p>
        )}
      </div>

      <span className="text-lg font-bold text-primary-600">
        {formatScore(score)}
      </span>
    </div>
  );
};

const TestLevelResultModal = ({
  currentLevel,
  isLoading = false,
  getAvailableTestLevels,
  handleLevelContinue,
  levelEvaluation
}) => {
  if (!levelEvaluation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Obliczanie wyników
          </h2>

          <FaSpinner className="mx-auto animate-spin text-4xl text-primary-600" />

          <p className="mt-4 text-sm text-gray-500">
            Analizujemy odpowiedzi z tego poziomu.
          </p>
        </div>
      </div>
    );
  }

  const sectionScores =
    levelEvaluation.sectionScores || {};

  const sectionWeights =
    levelEvaluation.weights || {};

  const writingEvaluation =
    levelEvaluation.writingEvaluation || {};

  const totalScore =
    clampScore(levelEvaluation.score);

  const passed =
    totalScore >= MIN_SCORE_TO_PASS;

  const availableLevelsResult =
    getAvailableTestLevels?.();

  const availableTestLevels =
    Array.isArray(availableLevelsResult)
      ? availableLevelsResult
      : [];

  const lastAvailableLevel =
    availableTestLevels[
      availableTestLevels.length - 1
    ];

  const isLastAvailableLevel =
    currentLevel === lastAvailableLevel;

  const canContinue =
    passed && !isLastAvailableLevel;

  const writingRequiresReview =
    writingEvaluation.requiresReview === true ||
    writingEvaluation.requiresManualReview === true;

  const writingIsFinal =
    writingEvaluation.isFinal === true &&
    !writingRequiresReview;

  const writingStatus =
    getWritingStatusMessage(
      writingEvaluation
    );

  const writingStatusClasses =
    getStatusClasses(
      writingStatus?.type
    );

  const hasEstimatedResult =
    levelEvaluation.isFinal !== true ||
    levelEvaluation.status === "estimated" ||
    levelEvaluation.status ===
      "partially_evaluated" ||
    levelEvaluation.requiresReview === true ||
    levelEvaluation.requiresManualReview === true ||
    !writingIsFinal;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="test-level-result-title"
    >
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">
        <div className="text-center">
          <h2
            id="test-level-result-title"
            className="text-2xl font-bold text-gray-900"
          >
            Wynik poziomu {currentLevel}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Minimalny wynik wymagany do przejścia dalej:{" "}
            {MIN_SCORE_TO_PASS}%
          </p>
        </div>

        {hasEstimatedResult && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
            <FaClock className="mt-1 shrink-0" />

            <div>
              <p className="font-semibold">
                Wynik tymczasowy
              </p>

              <p className="mt-1 text-sm leading-relaxed">
                Część pisemna może nadal wymagać
                automatycznej lub ręcznej weryfikacji.
                Aktualny wynik pozwala kontynuować test,
                ale może zostać później zaktualizowany.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <ScoreRow
            label="Wybór odpowiedzi"
            score={
              sectionScores.multipleChoice
            }
            weight={
              sectionWeights.multipleChoice
            }
          />

          <ScoreRow
            label="Pisanie"
            score={
              sectionScores.writing
            }
            weight={
              sectionWeights.writing
            }
            isEstimated={
              !writingIsFinal
            }
          />

          <ScoreRow
            label="Czytanie"
            score={
              sectionScores.reading
            }
            weight={
              sectionWeights.reading
            }
          />
        </div>

        {writingStatus && (
          <div
            className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 ${writingStatusClasses.container}`}
          >
            {writingStatus.type ===
            "final" ? (
              <FaCheckCircle
                className={`mt-1 shrink-0 ${writingStatusClasses.icon}`}
              />
            ) : (
              <FaExclamationTriangle
                className={`mt-1 shrink-0 ${writingStatusClasses.icon}`}
              />
            )}

            <div>
              <p className="font-semibold">
                {writingStatus.title}
              </p>

              <p className="mt-1 text-sm leading-relaxed">
                {writingStatus.description}
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-lg font-semibold text-gray-800">
            Łączny wynik poziomu
          </p>

          <p
            className={`mt-2 text-5xl font-bold ${
              passed
                ? "text-green-600"
                : "text-primary-600"
            }`}
          >
            {totalScore}%
          </p>

          {passed ? (
            <div className="mt-4 text-green-700">
              <p className="font-semibold">
                Gratulacje! Ten poziom został
                zaliczony.
              </p>

              {canContinue ? (
                <p className="mt-1 text-sm">
                  Możesz przejść do następnego
                  poziomu testu.
                </p>
              ) : (
                <p className="mt-1 text-sm">
                  To ostatni dostępny poziom testu.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4 text-gray-600">
              <p className="font-semibold">
                Wynik jest niższy niż wymagane
                minimum.
              </p>

              <p className="mt-1 text-sm">
                Zalecamy rozpoczęcie lub
                kontynuowanie nauki na poziomie{" "}
                {currentLevel}.
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleLevelContinue}
          disabled={isLoading}
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && (
            <FaSpinner className="animate-spin" />
          )}

          {isLoading
            ? "Przetwarzanie..."
            : canContinue
              ? "Przejdź do następnego poziomu"
              : "Zakończ test"}
        </button>
      </div>
    </div>
  );
};

ScoreRow.propTypes = {
  label:
    PropTypes.string.isRequired,

  score:
    PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string
    ]),

  weight:
    PropTypes.number,

  isEstimated:
    PropTypes.bool
};

TestLevelResultModal.propTypes = {
  currentLevel:
    PropTypes.oneOf([
      "A1",
      "A2",
      "B1",
      "B2",
      "C1",
      "C2"
    ]).isRequired,

  isLoading:
    PropTypes.bool,

  getAvailableTestLevels:
    PropTypes.func.isRequired,

  handleLevelContinue:
    PropTypes.func.isRequired,

  levelEvaluation:
    PropTypes.shape({
      score:
        PropTypes.number,

      status:
        PropTypes.string,

      isFinal:
        PropTypes.bool,

      requiresReview:
        PropTypes.bool,

      requiresManualReview:
        PropTypes.bool,

      sectionScores:
        PropTypes.shape({
          multipleChoice:
            PropTypes.number,

          writing:
            PropTypes.number,

          reading:
            PropTypes.number
        }),

      weights:
        PropTypes.shape({
          multipleChoice:
            PropTypes.number,

          writing:
            PropTypes.number,

          reading:
            PropTypes.number
        }),

      writingEvaluation:
        PropTypes.shape({
          status:
            PropTypes.string,

          isFinal:
            PropTypes.bool,

          requiresReview:
            PropTypes.bool,

          requiresManualReview:
            PropTypes.bool,

          provider:
            PropTypes.string,

          score:
            PropTypes.number
        })
    })
};

export default TestLevelResultModal;