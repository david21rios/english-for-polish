// src/components/test/TestResults.jsx

import PropTypes from "prop-types";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from "chart.js";

import { Bar } from "react-chartjs-2";

import {
  FaBookOpen,
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaExclamationTriangle,
  FaGraduationCap,
  FaLightbulb,
  FaListAlt,
  FaTrophy
} from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CEFR_LEVEL_ORDER = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2"
];

const DEFAULT_PASSING_SCORE = 70;

const LEVEL_DESCRIPTIONS = {
  A1: {
    title: "Poziom początkujący",
    recommendation:
      "Zalecamy rozpoczęcie od podstaw: codzienne słownictwo, proste zdania, przedstawianie się i podstawowa komunikacja.",
    abilities:
      "Potrafisz rozumieć i stosować bardzo podstawowe wyrażenia, przedstawiać się oraz zadawać proste pytania osobiste."
  },

  A2: {
    title: "Poziom podstawowy",
    recommendation:
      "Masz podstawy języka angielskiego. Rozwijaj proste rozmowy, krótkie teksty oraz słownictwo związane z codziennym życiem.",
    abilities:
      "Potrafisz komunikować się w prostych, rutynowych sytuacjach i opisywać podstawowe aspekty swojego życia."
  },

  B1: {
    title: "Poziom średniozaawansowany",
    recommendation:
      "Warto rozwijać płynność, czytanie ze zrozumieniem, wypowiedzi pisemne oraz komunikację w sytuacjach zawodowych i akademickich.",
    abilities:
      "Potrafisz radzić sobie w większości typowych sytuacji, opisywać doświadczenia oraz uzasadniać proste opinie."
  },

  B2: {
    title: "Poziom średniozaawansowany wyższy",
    recommendation:
      "Możesz pracować nad większą precyzją, naturalnością wypowiedzi oraz komunikacją akademicką i zawodową.",
    abilities:
      "Potrafisz rozumieć główne idee złożonych tekstów i komunikować się stosunkowo płynnie z użytkownikami języka angielskiego."
  },

  C1: {
    title: "Poziom zaawansowany",
    recommendation:
      "Skup się na argumentacji, stylu, precyzyjnym słownictwie, idiomach oraz złożonych strukturach językowych.",
    abilities:
      "Potrafisz elastycznie i skutecznie używać języka w celach społecznych, akademickich i zawodowych."
  },

  C2: {
    title: "Poziom biegły",
    recommendation:
      "Możesz doskonalić niuanse językowe, styl akademicki, precyzję oraz naturalność komunikacji na najwyższym poziomie.",
    abilities:
      "Potrafisz z łatwością rozumieć niemal wszystko, co czytasz lub słyszysz, oraz wyrażać się bardzo precyzyjnie i płynnie."
  }
};

const SKILL_DATA = {
  multipleChoice: {
    label: "Wybór odpowiedzi",
    description: "Gramatyka, słownictwo i praktyczne użycie języka.",
    icon: FaListAlt
  },

  writing: {
    label: "Pisanie",
    description: "Realizacja zadania, gramatyka, słownictwo i spójność.",
    icon: FaEdit
  },

  reading: {
    label: "Czytanie",
    description: "Rozumienie tekstu, szczegółów i znaczenia w kontekście.",
    icon: FaBookOpen
  }
};

const clampScore = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
};

const formatDuration = (secondsValue = 0) => {
  const totalSeconds = Math.max(Number(secondsValue) || 0, 0);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} godz. ${minutes} min`;
  }

  return `${minutes} min`;
};

const getCanonicalResults = (results = {}) => {
  return results?.results || results || {};
};

const getOrderedLevelEntries = (levelResults = {}) => {
  return CEFR_LEVEL_ORDER.filter((level) =>
    Object.prototype.hasOwnProperty.call(levelResults, level)
  ).map((level) => [level, clampScore(levelResults[level])]);
};

const getAverageScore = (scoreEntries = []) => {
  if (scoreEntries.length === 0) {
    return 0;
  }

  const totalScore = scoreEntries.reduce(
    (sum, [, score]) => sum + clampScore(score),
    0
  );

  return clampScore(totalScore / scoreEntries.length);
};

const getFinalLevelDetails = (level = "A1") => {
  return (
    LEVEL_DESCRIPTIONS[level] || {
      title: "Zalecany poziom nauki",
      recommendation:
        "Użyj wyniku jako wskazówki przy wyborze odpowiedniej ścieżki nauki.",
      abilities:
        "Wynik wskazuje najbardziej odpowiedni poziom rozpoczęcia dalszej nauki."
    }
  );
};

const getSkillScoreEntries = ({
  canonicalResults,
  finalLevel
}) => {
  const levelDetails =
    canonicalResults.levelDetails?.[finalLevel] ||
    canonicalResults.levelDetails?.[
      Object.keys(canonicalResults.levelDetails || {}).at(-1)
    ] ||
    {};

  const directSkillResults =
    canonicalResults.skillResults?.[finalLevel] ||
    levelDetails.sectionScores ||
    {};

  return Object.entries(SKILL_DATA)
    .map(([skill, metadata]) => ({
      skill,
      ...metadata,
      score:
        directSkillResults?.[skill] === null ||
        directSkillResults?.[skill] === undefined
          ? null
          : clampScore(directSkillResults[skill]),
      isEstimated:
        skill === "writing" &&
        levelDetails?.writingEvaluation?.isFinal !== true
    }))
    .filter((item) => item.score !== null);
};

const getSkillMessage = (score) => {
  if (score >= 85) {
    return "Bardzo mocny wynik";
  }

  if (score >= 70) {
    return "Poziom zaliczony";
  }

  if (score >= 50) {
    return "Wymaga dalszego rozwoju";
  }

  return "Wymaga szczególnego wzmocnienia";
};

const ResultStatusNotice = ({
  isEstimated,
  requiresReview
}) => {
  if (!isEstimated && !requiresReview) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
        <FaCheckCircle className="mt-1 shrink-0" />

        <div>
          <p className="font-semibold">
            Wynik został obliczony
          </p>

          <p className="mt-1 text-sm leading-relaxed">
            Wszystkie dostępne części testu zostały ocenione.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
      <FaClock className="mt-1 shrink-0" />

      <div>
        <p className="font-semibold">
          Wynik tymczasowy
        </p>

        <p className="mt-1 text-sm leading-relaxed">
          Część pisemna została oceniona wstępnie. Odpowiedzi zapisano i mogą
          zostać ponownie sprawdzone automatycznie lub przez nauczyciela.
          Zalecany poziom może zostać zaktualizowany po zakończeniu pełnej
          weryfikacji.
        </p>
      </div>
    </div>
  );
};

ResultStatusNotice.propTypes = {
  isEstimated: PropTypes.bool.isRequired,
  requiresReview: PropTypes.bool.isRequired
};

const TestResults = ({ results }) => {
  if (!results) {
    return (
      <div className="rounded-3xl border border-red-100 bg-white p-8 shadow-lg">
        <div className="flex items-start gap-3">
          <FaExclamationTriangle className="mt-1 shrink-0 text-red-600" />

          <div>
            <h3 className="text-xl font-semibold text-red-600">
              Brak dostępnych wyników
            </h3>

            <p className="mt-2 text-gray-600">
              Nie udało się załadować wyniku testu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const canonicalResults = getCanonicalResults(results);

  const levelScores =
    canonicalResults.levelResults ||
    canonicalResults.filterResults ||
    {};

  const scoreEntries = getOrderedLevelEntries(levelScores);

  const finalLevel =
    canonicalResults.placementLevel ||
    canonicalResults.finalLevel ||
    "A1";

  const passingScore =
    Number(canonicalResults.passingScore) ||
    DEFAULT_PASSING_SCORE;

  const overallScore =
    canonicalResults.overallScore !== undefined
      ? clampScore(canonicalResults.overallScore)
      : getAverageScore(scoreEntries);

  const passedLevels = scoreEntries.filter(
    ([, score]) => score >= passingScore
  ).length;

  const finalLevelDetails = getFinalLevelDetails(finalLevel);

  const skillScores = getSkillScoreEntries({
    canonicalResults,
    finalLevel
  });

  const resultStatus =
    canonicalResults.resultStatus ||
    (canonicalResults.requiresReview ? "estimated" : "final");

  const isEstimated = resultStatus !== "final";

  const requiresReview =
    canonicalResults.requiresReview === true ||
    isEstimated;

  const timeSpent = Number(canonicalResults.timeSpent) || 0;

  const chartData = {
    labels: scoreEntries.map(([level]) => level),

    datasets: [
      {
        label: "Wynik poziomu",
        data: scoreEntries.map(([, score]) => score),
        backgroundColor: "rgba(59, 130, 246, 0.55)",
        borderColor: "rgb(37, 99, 235)",
        borderWidth: 1,
        borderRadius: 8
      },

      {
        label: "Próg zaliczenia",
        data: scoreEntries.map(() => passingScore),
        backgroundColor: "rgba(34, 197, 94, 0.22)",
        borderColor: "rgb(22, 163, 74)",
        borderWidth: 1,
        borderRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: true,
        position: "bottom"
      },

      title: {
        display: true,
        text: "Wyniki według ocenionych poziomów CEFR"
      },

      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${context.parsed.y}%`
        }
      }
    },

    scales: {
      y: {
        beginAtZero: true,
        max: 100,

        ticks: {
          callback: (value) => `${value}%`
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-primary-600 to-secondary-600 p-7 text-center text-white shadow-2xl md:p-10">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/20 text-5xl">
          <FaTrophy />
        </div>

        <p className="text-sm font-semibold uppercase tracking-wide text-primary-100">
          {isEstimated
            ? "Szacowany wynik testu"
            : "Końcowy wynik testu"}
        </p>

        <h1 className="mt-3 text-4xl font-bold md:text-5xl">
          Zalecany poziom: {finalLevel}
        </h1>

        <p className="mt-2 text-lg font-semibold text-white/90">
          {finalLevelDetails.title}
        </p>

        <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-primary-50">
          {finalLevelDetails.recommendation}
        </p>
      </section>

      <ResultStatusNotice
        isEstimated={isEstimated}
        requiresReview={requiresReview}
      />

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <FaGraduationCap className="mx-auto mb-3 text-3xl text-primary-600" />

          <p className="text-3xl font-bold text-primary-700">
            {finalLevel}
          </p>

          <p className="mt-1 text-sm text-gray-600">
            Zalecany poziom
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <FaChartBar className="mx-auto mb-3 text-3xl text-green-600" />

          <p className="text-3xl font-bold text-green-700">
            {overallScore}%
          </p>

          <p className="mt-1 text-sm text-gray-600">
            Średni wynik ocenionych poziomów
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <FaCheckCircle className="mx-auto mb-3 text-3xl text-yellow-600" />

          <p className="text-3xl font-bold text-yellow-700">
            {passedLevels}/{scoreEntries.length}
          </p>

          <p className="mt-1 text-sm text-gray-600">
            Zaliczone poziomy
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <FaClock className="mx-auto mb-3 text-3xl text-blue-600" />

          <p className="text-2xl font-bold text-blue-700">
            {formatDuration(timeSpent)}
          </p>

          <p className="mt-1 text-sm text-gray-600">
            Czas rozwiązania
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg md:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
            <FaGraduationCap />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Co oznacza poziom {finalLevel}?
            </h2>

            <p className="mt-2 leading-relaxed text-gray-600">
              {finalLevelDetails.abilities}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="font-semibold text-blue-900">
            Zalecany następny krok
          </p>

          <p className="mt-2 text-sm leading-relaxed text-blue-800">
            Rozpocznij naukę na poziomie {finalLevel}. Wynik testu służy do
            wskazania odpowiedniej ścieżki edukacyjnej i nie jest formalnym
            certyfikatem znajomości języka.
          </p>
        </div>
      </section>

      {skillScores.length > 0 && (
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-600">
              <FaChartBar />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Wyniki według umiejętności
              </h2>

              <p className="text-sm text-gray-600">
                Podsumowanie ostatniego ocenianego poziomu.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {skillScores.map(
              ({
                skill,
                label,
                description,
                icon: SkillIcon,
                score,
                isEstimated: skillIsEstimated
              }) => (
                <article
                  key={skill}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm">
                      <SkillIcon />
                    </div>

                    <p
                      className={`text-3xl font-bold ${
                        score >= passingScore
                          ? "text-green-700"
                          : "text-orange-700"
                      }`}
                    >
                      {score}%
                    </p>
                  </div>

                  <h3 className="mt-4 font-bold text-gray-900">
                    {label}
                  </h3>

                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    {description}
                  </p>

                  <p
                    className={`mt-3 text-sm font-semibold ${
                      score >= passingScore
                        ? "text-green-700"
                        : "text-orange-700"
                    }`}
                  >
                    {getSkillMessage(score)}
                  </p>

                  {skillIsEstimated && (
                    <p className="mt-2 text-xs text-yellow-700">
                      Ocena pisania jest tymczasowa.
                    </p>
                  )}
                </article>
              )
            )}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
            <FaLightbulb />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Podsumowanie według poziomu
            </h2>

            <p className="text-sm text-gray-600">
              Wyniki uzyskane na każdym poziomie odwiedzonym podczas testu.
            </p>
          </div>
        </div>

        {scoreEntries.length === 0 ? (
          <div className="flex gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
            <FaExclamationTriangle className="mt-1 shrink-0" />

            <span>
              Brak wyników według poziomu.
            </span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {scoreEntries.map(([level, score]) => {
                const passed = score >= passingScore;

                const levelDetail =
                  canonicalResults.levelDetails?.[level];

                const levelIsEstimated =
                  levelDetail?.isFinal === false ||
                  levelDetail?.status === "estimated";

                return (
                  <article
                    key={level}
                    className={`rounded-2xl border p-5 ${
                      passed
                        ? "border-green-100 bg-green-50"
                        : "border-orange-100 bg-orange-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Poziom CEFR
                        </p>

                        <h3 className="mt-1 text-xl font-bold text-gray-900">
                          {level}
                        </h3>

                        <p
                          className={`mt-2 text-3xl font-bold ${
                            passed
                              ? "text-green-700"
                              : "text-orange-700"
                          }`}
                        >
                          {score}%
                        </p>
                      </div>

                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          passed
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {passed ? (
                          <FaCheckCircle />
                        ) : (
                          <FaLightbulb />
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                      {passed
                        ? "Poziom zaliczony. Możesz kontynuować ocenę na wyższym poziomie."
                        : "Ten poziom warto wzmocnić przed przejściem do bardziej zaawansowanych treści."}
                    </p>

                    {levelIsEstimated && (
                      <p className="mt-3 text-xs font-medium text-yellow-700">
                        Wynik zawiera tymczasową ocenę części pisemnej.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="h-[320px]">
                <Bar
                  data={chartData}
                  options={chartOptions}
                />
              </div>
            </div>
          </>
        )}
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg md:p-8">
        <div className="flex items-start gap-3">
          <FaExclamationTriangle className="mt-1 shrink-0 text-gray-500" />

          <div>
            <h2 className="font-bold text-gray-900">
              Ważna informacja
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Test poziomujący stanowi narzędzie diagnostyczne platformy.
              Wynik pomaga wybrać odpowiedni poziom nauki, ale nie zastępuje
              formalnego egzaminu ani certyfikatu CEFR wydawanego przez
              uprawnioną instytucję.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

TestResults.propTypes = {
  results: PropTypes.shape({
    results: PropTypes.object,
    placementLevel: PropTypes.string,
    finalLevel: PropTypes.string,
    overallScore: PropTypes.number,
    levelResults: PropTypes.object,
    filterResults: PropTypes.object,
    levelDetails: PropTypes.object,
    skillResults: PropTypes.object,
    resultStatus: PropTypes.string,
    requiresReview: PropTypes.bool,
    passingScore: PropTypes.number,
    timeSpent: PropTypes.number
  })
};

export default TestResults;