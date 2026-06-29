import React, { useState, useEffect } from "react";

const countWords = (text = "") => {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
};

const normalizeCriteria = (criterios = []) => {
  if (!Array.isArray(criterios)) return [];

  return criterios
    .map((criterio) => criterio?.toString().trim())
    .filter(Boolean);
};

const buildBasicFeedback = ({ text, minWords, criterios }) => {
  const wordCount = countWords(text);
  const trimmedText = text.trim();

  const feedback = [];

  if (!trimmedText) {
    feedback.push({
      type: "error",
      text: "Escribe una respuesta antes de revisar."
    });
  }

  if (wordCount < minWords) {
    feedback.push({
      type: "error",
      text: `Tu respuesta tiene ${wordCount} palabra(s). Debes escribir mínimo ${minWords}.`
    });
  } else {
    feedback.push({
      type: "success",
      text: `Cumpliste el mínimo de palabras: ${wordCount}/${minWords}.`
    });
  }

  if (trimmedText.length > 0) {
    const startsWithCapital = /^[A-ZÁÉÍÓÚÑÜ¿¡]/.test(trimmedText);
    const endsWithPunctuation = /[.!?。！？]$/.test(trimmedText);

    if (startsWithCapital) {
      feedback.push({
        type: "success",
        text: "La respuesta inicia correctamente."
      });
    } else {
      feedback.push({
        type: "warning",
        text: "Revisa si tu respuesta debe iniciar con mayúscula."
      });
    }

    if (endsWithPunctuation) {
      feedback.push({
        type: "success",
        text: "La respuesta termina con signo de puntuación."
      });
    } else {
      feedback.push({
        type: "warning",
        text: "Agrega un signo de puntuación al final si corresponde."
      });
    }
  }

  if (criterios.length > 0) {
    feedback.push({
      type: "info",
      text: "Revisa manualmente si tu respuesta cumple los criterios indicados."
    });
  }

  const hasErrors = feedback.some((item) => item.type === "error");

  return {
    passed: !hasErrors,
    feedback
  };
};

const getFeedbackClass = (type) => {
  const classes = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
  };

  return classes[type] || classes.info;
};

const WritingExercises = ({ ejercicios, onComplete }) => {
  const [responses, setResponses] = useState({});
  const [wordCounts, setWordCounts] = useState({});
  const [reviews, setReviews] = useState({});
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setResponses({});
    setWordCounts({});
    setReviews({});
    setCompleted(false);
  }, [ejercicios]);

  useEffect(() => {
    if (!ejercicios || ejercicios.length === 0 || completed) return;

    const allReviewedAndPassed = ejercicios.every((_, index) => {
      return reviews[index]?.passed === true;
    });

    if (allReviewedAndPassed) {
      setCompleted(true);
      onComplete?.();
    }
  }, [reviews, ejercicios, onComplete, completed]);

  const handleTextChange = (index, text) => {
    setResponses((prev) => ({
      ...prev,
      [index]: text
    }));

    setWordCounts((prev) => ({
      ...prev,
      [index]: countWords(text)
    }));

    setReviews((prev) => ({
      ...prev,
      [index]: undefined
    }));
  };

  const handleReview = (index, ejercicio) => {
    const text = responses[index] || "";
    const minWords = Number(ejercicio.extension_minima) || 1;
    const criterios = normalizeCriteria(ejercicio.criterios);

    const review = buildBasicFeedback({
      text,
      minWords,
      criterios
    });

    setReviews((prev) => ({
      ...prev,
      [index]: review
    }));
  };

  if (!ejercicios || ejercicios.length === 0) return null;

  return (
    <>
      {ejercicios.map((ejercicio, index) => {
        const minWords = Number(ejercicio.extension_minima) || 1;
        const suggestedTime = Number(ejercicio.tiempo_sugerido) || null;
        const currentWords = wordCounts[index] || 0;
        const criterios = normalizeCriteria(ejercicio.criterios);
        const review = reviews[index];
        const isUnderMinimum = currentWords < minWords;

        return (
          <div
            key={index}
            className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {ejercicio.instrucciones ||
                    ejercicio.consigna ||
                    "Escribe tu respuesta."}
                </h3>

                {ejercicio.guia && (
                  <p className="text-gray-600 mt-2">{ejercicio.guia}</p>
                )}
              </div>

              {review?.passed && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                  Revisado
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3 text-sm bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4">
              <span className="font-semibold text-blue-800">
                Mínimo: {minWords} palabras
              </span>

              {suggestedTime && (
                <span className="text-blue-700">
                  Tiempo sugerido: {suggestedTime} minutos
                </span>
              )}
            </div>

            {criterios.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-xl mb-4">
                <h4 className="font-semibold text-primary-600 mb-2">
                  Criterios de evaluación:
                </h4>

                <ul className="list-disc pl-5 space-y-1">
                  {criterios.map((criterio, idx) => (
                    <li key={idx} className="text-gray-700">
                      {criterio}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <textarea
              className="w-full p-4 border rounded-xl min-h-[200px] focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="Escribe tu respuesta aquí..."
              value={responses[index] || ""}
              onChange={(e) => handleTextChange(index, e.target.value)}
            />

            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm mt-3">
              <span className="text-gray-600">
                Palabras escritas:{" "}
                <span
                  className={
                    isUnderMinimum
                      ? "font-semibold text-red-600"
                      : "font-semibold text-green-600"
                  }
                >
                  {currentWords}
                </span>
              </span>

              <span className="text-gray-600">
                Mínimo requerido: {minWords} palabras
              </span>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleReview(index, ejercicio)}
                className="px-5 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
              >
                Revisar escritura
              </button>

              {review && !review.passed && (
                <span className="text-sm text-gray-500 self-center">
                  Corrige tu respuesta y vuelve a revisar.
                </span>
              )}
            </div>

            {review && (
              <div className="mt-4 space-y-2">
                {review.feedback.map((item, feedbackIndex) => (
                  <div
                    key={feedbackIndex}
                    className={`border p-3 rounded-xl text-sm ${getFeedbackClass(
                      item.type
                    )}`}
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 p-3 rounded-xl bg-gray-50 text-sm text-gray-600">
              Esta revisión es básica. La corrección detallada de gramática,
              vocabulario y estilo podrá hacerse con IA o revisión del profesor
              en una fase posterior.
            </div>
          </div>
        );
      })}
    </>
  );
};

export default WritingExercises;