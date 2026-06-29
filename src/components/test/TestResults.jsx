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

const getRecommendationMessage = (finalLevel) => {
  const messages = {
    "A1-A2":
      "Te recomendamos iniciar desde las bases del idioma para fortalecer vocabulario, frases simples y comprensión inicial.",
    "A2-B1":
      "Tienes una base inicial. Puedes avanzar hacia conversaciones cotidianas, lectura sencilla y escritura guiada.",
    "B1-B2":
      "Tienes un nivel intermedio. Puedes trabajar más fluidez, comprensión de textos y producción escrita con más detalle.",
    "B2-C1":
      "Tienes un nivel intermedio alto. Puedes enfocarte en precisión, naturalidad y comunicación profesional.",
    "C1-C2":
      "Tienes un nivel avanzado. Puedes trabajar matices, argumentación, escritura compleja y conversación natural."
  };

  return (
    messages[finalLevel] ||
    "Usa este resultado como orientación inicial para elegir tu ruta de aprendizaje."
  );
};

const TestResults = ({ results }) => {
  if (!results) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-red-100">
        <h3 className="text-xl font-semibold text-red-600">
          No hay resultados disponibles
        </h3>
        <p className="text-gray-600 mt-2">
          No se pudo cargar el resultado del test.
        </p>
      </div>
    );
  }

  const filterScores = results.filterResults || {};
  const scoreEntries = Object.entries(filterScores);
  const finalLevel = results.finalLevel || "No definido";

  const passedLevels = scoreEntries.filter(
    ([, score]) => Number(score) >= 70
  ).length;

  const averageScore =
    scoreEntries.length > 0
      ? Math.round(
          scoreEntries.reduce((sum, [, score]) => sum + (Number(score) || 0), 0) /
            scoreEntries.length
        )
      : 0;

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-3xl shadow-2xl p-8 text-white text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-white/20 border border-white/20 flex items-center justify-center text-5xl mb-6">
          <FaTrophy />
        </div>

        <p className="text-sm font-semibold uppercase tracking-wide text-primary-100">
          Resultado final del test
        </p>

        <h2 className="text-4xl md:text-5xl font-bold mt-3">
          Nivel recomendado: {finalLevel}
        </h2>

        <p className="text-primary-50 mt-5 max-w-2xl mx-auto leading-relaxed">
          {getRecommendationMessage(results.finalLevel)}
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <FaGraduationCap className="mx-auto text-primary-600 text-3xl mb-3" />
          <p className="text-3xl font-bold text-primary-700">{finalLevel}</p>
          <p className="text-sm text-gray-600 mt-1">Nivel sugerido</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <FaChartBar className="mx-auto text-green-600 text-3xl mb-3" />
          <p className="text-3xl font-bold text-green-700">{averageScore}%</p>
          <p className="text-sm text-gray-600 mt-1">Promedio general</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <FaCheckCircle className="mx-auto text-yellow-600 text-3xl mb-3" />
          <p className="text-3xl font-bold text-yellow-700">
            {passedLevels}/{scoreEntries.length}
          </p>
          <p className="text-sm text-gray-600 mt-1">Niveles superados</p>
        </div>
      </section>

      <section className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
            <FaLightbulb />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Resumen por nivel
            </h3>
            <p className="text-gray-600 text-sm">
              Revisa tu desempeño en cada bloque evaluado.
            </p>
          </div>
        </div>

        {scoreEntries.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl flex gap-3">
            <FaExclamationTriangle className="mt-1" />
            <span>No hay puntuaciones por nivel disponibles.</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {scoreEntries.map(([filter, score]) => {
                const safeScore = Number(score) || 0;
                const passed = safeScore >= 70;

                return (
                  <div
                    key={filter}
                    className={`p-5 rounded-2xl border ${
                      passed
                        ? "bg-green-50 border-green-100"
                        : "bg-orange-50 border-orange-100"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="font-bold text-gray-900">{filter}</h4>

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
                        ? "Nivel superado. Puedes avanzar con confianza."
                        : "Nivel recomendado para reforzar antes de avanzar."}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <Bar
                data={{
                  labels: scoreEntries.map(([filter]) => filter),
                  datasets: [
                    {
                      label: "Puntuación por nivel",
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
                      text: "Resultados por nivel"
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