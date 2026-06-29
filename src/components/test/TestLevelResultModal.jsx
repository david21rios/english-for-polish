// src/components/test/TestLevelResultModal.jsx

import { useEffect, useState } from "react";

const MIN_SCORE_TO_PASS = 70;

const TestLevelResultModal = ({
  currentLevel,
  isLoading,
  calculateSectionScore,
  getAvailableTestLevels,
  handleLevelContinue
}) => {
  const [scores, setScores] = useState({
    multipleChoice: 0,
    writing: 0,
    reading: 0,
    total: 0
  });

  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    let mounted = true;

    const calculateScores = async () => {
      const multipleChoiceScore = await calculateSectionScore(
        "multipleChoice",
        currentLevel
      );

      const writingScore = await calculateSectionScore("writing", currentLevel);
      const readingScore = await calculateSectionScore("reading", currentLevel);

      const totalScore = Math.round(
        (multipleChoiceScore + writingScore + readingScore) / 3
      );

      if (!mounted) return;

      setScores({
        multipleChoice: Math.round(multipleChoiceScore),
        writing: Math.round(writingScore),
        reading: Math.round(readingScore),
        total: totalScore
      });

      setIsCalculating(false);
    };

    calculateScores();

    return () => {
      mounted = false;
    };
  }, [currentLevel, calculateSectionScore]);

  if (isCalculating) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-lg text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Calculando resultados
          </h2>

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
        </div>
      </div>
    );
  }

  const availableTestLevels = getAvailableTestLevels();
  const lastAvailableLevel = availableTestLevels[availableTestLevels.length - 1];

  const canContinue =
    scores.total >= MIN_SCORE_TO_PASS && currentLevel !== lastAvailableLevel;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Resultado del nivel {currentLevel}
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-700">
              Selección múltiple:
            </span>
            <span className="font-bold text-primary-600">
              {scores.multipleChoice}%
            </span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-700">Escritura:</span>
            <span className="font-bold text-primary-600">
              {scores.writing}%
            </span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-700">Lectura:</span>
            <span className="font-bold text-primary-600">
              {scores.reading}%
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xl font-semibold text-gray-800 mb-2">
            Puntaje Total:
          </p>

          <p
            className={`text-5xl font-bold ${
              scores.total >= MIN_SCORE_TO_PASS
                ? "text-green-600"
                : "text-primary-600"
            }`}
          >
            {scores.total}%
          </p>

          {scores.total >= MIN_SCORE_TO_PASS ? (
            <div className="text-green-600 mt-3">
              <p>¡Felicitaciones! Has superado este nivel.</p>
              {canContinue ? (
                <p className="mt-1">Puedes continuar al siguiente nivel.</p>
              ) : (
                <p className="mt-1">Has llegado al último test disponible.</p>
              )}
            </div>
          ) : (
            <div className="text-gray-600 mt-3">
              <p>
                Tu puntuación está por debajo del mínimo requerido (
                {MIN_SCORE_TO_PASS}%).
              </p>
              <p className="mt-1">
                Te recomendamos comenzar tus clases desde el nivel {currentLevel}.
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleLevelContinue}
          disabled={isLoading}
          className="w-full mt-6 bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {isLoading
            ? "Cargando..."
            : canContinue
            ? "Continuar al siguiente nivel"
            : "Finalizar test"}
        </button>
      </div>
    </div>
  );
};

export default TestLevelResultModal;