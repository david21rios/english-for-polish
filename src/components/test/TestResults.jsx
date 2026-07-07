// src/components/test/TestResults.jsx

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  FaChartBar,
  FaCheckCircle,
  FaExclamationTriangle,
  FaGraduationCap,
  FaLightbulb,
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

const getRecommendationMessage = (level = "A1") => {
  const messages = {
    A1: "Zalecamy rozpoczęcie od podstaw: proste słownictwo, podstawowe zdania i codzienna komunikacja.",
    A2: "Masz podstawy języka angielskiego. Możesz rozwijać proste rozmowy, krótkie teksty i praktyczne słownictwo.",
    B1: "Masz poziom średniozaawansowany. Warto rozwijać płynność, czytanie ze zrozumieniem i dłuższe wypowiedzi.",
    B2: "Masz poziom średniozaawansowany wyższy. Możesz pracować nad precyzją, naturalnością i komunikacją akademicką lub zawodową.",
    C1: "Masz poziom zaawansowany. Skup się na argumentacji, stylu, idiomach i złożonych strukturach.",
    C2: "Masz bardzo wysoki poziom. Możesz doskonalić niuanse językowe, styl akademicki i naturalną komunikację."
  };

  return (
    messages[level] ||
    "Użyj tego wyniku jako wskazówki do wyboru odpowiedniej ścieżki nauki."
  );
};

const TestResults = ({ results }) => {
  if (!results) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-red-100">
        <h3 className="text-xl font-semibold text-red-600">
          Brak dostępnych wyników
        </h3>

        <p className="text-gray-600 mt-2">
          Nie udało się załadować wyniku testu.
        </p>
      </div>
    );
  }

  const canonicalResults = results.results || results;

  const levelScores =
    canonicalResults.levelResults ||
    canonicalResults.filterResults ||
    {};

  const scoreEntries = Object.entries(levelScores);

  const finalLevel =
    canonicalResults.placementLevel ||
    canonicalResults.finalLevel ||
    "A1";

  const overallScore =
    Number(canonicalResults.overallScore) ||
    (scoreEntries.length > 0
      ? Math.round(
          scoreEntries.reduce(
            (sum, [, score]) => sum + (Number(score) || 0),
            0
          ) / scoreEntries.length
        )
      : 0);

  const passedLevels = scoreEntries.filter(
    ([, score]) => Number(score) >= 70
  ).length;

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-3xl shadow-2xl p-8 text-white text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-white/20 border border-white/20 flex items-center justify-center text-5xl mb-6">
          <FaTrophy />
        </div>

        <p className="text-sm font-semibold uppercase tracking-wide text-primary-100">
          Końcowy wynik testu
        </p>

        <h2 className="text-4xl md:text-5xl font-bold mt-3">
          Zalecany poziom: {finalLevel}
        </h2>

        <p className="text-primary-50 mt-5 max-w-2xl mx-auto leading-relaxed">
          {getRecommendationMessage(finalLevel)}
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <FaGraduationCap className="mx-auto text-primary-600 text-3xl mb-3" />
          <p className="text-3xl font-bold text-primary-700">{finalLevel}</p>
          <p className="text-sm text-gray-600 mt-1">Zalecany poziom</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <FaChartBar className="mx-auto text-green-600 text-3xl mb-3" />
          <p className="text-3xl font-bold text-green-700">
            {overallScore}%
          </p>
          <p className="text-sm text-gray-600 mt-1">Średni wynik</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <FaCheckCircle className="mx-auto text-yellow-600 text-3xl mb-3" />
          <p className="text-3xl font-bold text-yellow-700">
            {passedLevels}/{scoreEntries.length}
          </p>
          <p className="text-sm text-gray-600 mt-1">Zaliczone poziomy</p>
        </div>
      </section>

      <section className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
            <FaLightbulb />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Podsumowanie według poziomu
            </h3>

            <p className="text-gray-600 text-sm">
              Sprawdź swój wynik na każdym ocenianym poziomie CEFR.
            </p>
          </div>
        </div>

        {scoreEntries.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl flex gap-3">
            <FaExclamationTriangle className="mt-1" />
            <span>Brak wyników według poziomu.</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {scoreEntries.map(([level, score]) => {
                const safeScore = Number(score) || 0;
                const passed = safeScore >= 70;

                return (
                  <div
                    key={level}
                    className={`p-5 rounded-2xl border ${
                      passed
                        ? "bg-green-50 border-green-100"
                        : "bg-orange-50 border-orange-100"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="font-bold text-gray-900">{level}</h4>

                        <p
                          className={`text-3xl font-bold mt-2 ${
                            passed ? "text-green-700" : "text-orange-700"
                          }`}
                        >
                          {Math.round(safeScore)}%
                        </p>
                      </div>

                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          passed
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {passed ? <FaCheckCircle /> : <FaLightbulb />}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mt-3">
                      {passed
                        ? "Poziom zaliczony. Możesz kontynuować naukę na wyższym poziomie."
                        : "Ten poziom warto wzmocnić przed przejściem dalej."}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <Bar
                data={{
                  labels: scoreEntries.map(([level]) => level),
                  datasets: [
                    {
                      label: "Wynik według poziomu",
                      data: scoreEntries.map(([, score]) => Number(score) || 0),
                      backgroundColor: "rgba(59, 130, 246, 0.5)",
                      borderColor: "rgb(59, 130, 246)",
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false
                    },
                    title: {
                      display: true,
                      text: "Wyniki według poziomu CEFR"
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.parsed.y}%`
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
                }}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default TestResults;