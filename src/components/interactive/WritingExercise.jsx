// src/components/interactive/WritingExercise.jsx

import React, {
  useEffect,
  useRef,
  useState
} from "react";

const countWords = (text = "") =>
  text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .length;

const normalizeCriteria = (criteria = []) => {
  if (!Array.isArray(criteria)) {
    return [];
  }

  return criteria
    .map((criterion) =>
      criterion
        ?.toString()
        .trim()
    )
    .filter(Boolean);
};

const getMinimumWords = (exercise = {}) =>
  Number(
    exercise.minimumWords ||
      exercise.minWords ||
      exercise.extension_minima
  ) || 1;

const getMaximumWords = (exercise = {}) =>
  Number(
    exercise.maximumWords ||
      exercise.maxWords ||
      exercise.extension_maxima
  ) || null;

const getSuggestedTime = (exercise = {}) =>
  Number(
    exercise.suggestedTimeMinutes ||
      exercise.suggestedMinutes ||
      exercise.tiempo_sugerido
  ) || null;

const getCriteria = (exercise = {}) =>
  normalizeCriteria(
    exercise.criteria ||
      exercise.criterios
  );

const getInstruction = (exercise = {}) =>
  exercise.instruction ||
  exercise.instructions ||
  exercise.instrucciones ||
  exercise.prompt ||
  exercise.consigna ||
  "Napisz odpowiedź po angielsku.";

const getGuide = (exercise = {}) =>
  exercise.guide ||
  exercise.guia ||
  "";

const buildWordCounts = (responses = {}) =>
  Object.entries(responses).reduce(
    (accumulator, [index, text]) => {
      accumulator[index] =
        countWords(text);

      return accumulator;
    },
    {}
  );

const buildBasicFeedback = ({
  text,
  minWords,
  maxWords,
  criteria
}) => {
  const wordCount =
    countWords(text);

  const trimmedText =
    text.trim();

  const feedback = [];

  if (!trimmedText) {
    feedback.push({
      type: "error",
      text: "Najpierw wpisz odpowiedź."
    });
  }

  if (wordCount < minWords) {
    feedback.push({
      type: "error",
      text: `Twoja odpowiedź ma ${wordCount} słowo/słów. Minimalna liczba to ${minWords}.`
    });
  } else {
    feedback.push({
      type: "success",
      text: `Osiągnięto minimalną liczbę słów: ${wordCount}/${minWords}.`
    });
  }

  if (
    maxWords &&
    wordCount > maxWords
  ) {
    feedback.push({
      type: "warning",
      text: `Twoja odpowiedź ma ${wordCount} słowo/słów. Zalecane maksimum to ${maxWords}.`
    });
  }

  if (trimmedText.length > 0) {
    const startsWithCapital =
      /^[A-Z]/.test(trimmedText);

    const endsWithPunctuation =
      /[.!?]$/.test(trimmedText);

    feedback.push({
      type: startsWithCapital
        ? "success"
        : "warning",

      text: startsWithCapital
        ? "Odpowiedź zaczyna się wielką literą."
        : "Sprawdź, czy odpowiedź powinna zaczynać się wielką literą."
    });

    feedback.push({
      type: endsWithPunctuation
        ? "success"
        : "warning",

      text: endsWithPunctuation
        ? "Odpowiedź kończy się znakiem interpunkcyjnym."
        : "Dodaj znak interpunkcyjny na końcu, jeśli jest potrzebny."
    });
  }

  if (criteria.length > 0) {
    feedback.push({
      type: "info",
      text: "Sprawdź ręcznie, czy odpowiedź spełnia podane kryteria."
    });
  }

  return {
    passed: !feedback.some(
      (item) =>
        item.type === "error"
    ),

    feedback
  };
};

const getFeedbackClass = (type) => {
  const classes = {
    success:
      "bg-green-50 border-green-200 text-green-800",

    error:
      "bg-red-50 border-red-200 text-red-800",

    warning:
      "bg-yellow-50 border-yellow-200 text-yellow-800",

    info:
      "bg-blue-50 border-blue-200 text-blue-800"
  };

  return (
    classes[type] ||
    classes.info
  );
};

const WritingExercises = ({
  ejercicios = [],
  initialResult = null,
  onProgress = null,
  onComplete
}) => {
  /*
   * El componente se desmonta al salir de la
   * sección y se monta nuevamente al regresar.
   * Por eso podemos recuperar initialResult
   * directamente al crear los estados, sin
   * observar continuamente sus cambios.
   */
  const initialResponses =
    initialResult?.responses &&
    typeof initialResult.responses ===
      "object"
      ? initialResult.responses
      : {};

  const initialReviews =
    initialResult?.reviews &&
    typeof initialResult.reviews ===
      "object"
      ? initialResult.reviews
      : {};

  const [responses, setResponses] =
    useState(initialResponses);

  const [
    wordCounts,
    setWordCounts
  ] = useState(() =>
    buildWordCounts(
      initialResponses
    )
  );

  const [reviews, setReviews] =
    useState(initialReviews);

  const [completed, setCompleted] =
    useState(
      Boolean(
        initialResult?.completed
      )
    );

  /*
   * Conservamos siempre las versiones más
   * recientes de los callbacks sin convertirlos
   * en dependencias del efecto de persistencia.
   */
  const onProgressRef =
    useRef(onProgress);

  const onCompleteRef =
    useRef(onComplete);

  const completionNotifiedRef =
    useRef(
      Boolean(
        initialResult?.completed
      )
    );

  /*
   * Evita guardar automáticamente los datos
   * restaurados durante el primer montaje.
   */
  const mountedRef =
    useRef(false);

  useEffect(() => {
    onProgressRef.current =
      onProgress;
  }, [onProgress]);

  useEffect(() => {
    onCompleteRef.current =
      onComplete;
  }, [onComplete]);

  /*
   * Solo se ejecuta cuando cambia reviews.
   *
   * Escribir en el textarea no guarda en
   * Firestore por cada carácter. El guardado
   * sucede al pulsar "Sprawdź odpowiedź".
   */
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    if (!ejercicios.length) {
      return;
    }

    const completedExercises =
      ejercicios.filter(
        (_, index) =>
          reviews[index]?.passed ===
          true
      ).length;

    const allReviewedAndPassed =
      completedExercises ===
      ejercicios.length;

    const result = {
      completed:
        allReviewedAndPassed,

      score: null,

      totalExercises:
        ejercicios.length,

      completedExercises,

      responses,

      reviews
    };

    if (allReviewedAndPassed) {
      setCompleted(true);

      if (
        !completionNotifiedRef.current
      ) {
        completionNotifiedRef.current =
          true;

        onCompleteRef.current?.(
          result
        );
      }

      return;
    }

    setCompleted(false);

    completionNotifiedRef.current =
      false;

    if (
      Object.keys(reviews).length >
      0
    ) {
      onProgressRef.current?.(
        result
      );
    }
  }, [
    reviews,
    ejercicios
  ]);

  const handleTextChange = (
    index,
    text
  ) => {
    const nextResponses = {
      ...responses,
      [index]: text
    };

    setResponses(
      nextResponses
    );

    setWordCounts(
      (previousCounts) => ({
        ...previousCounts,
        [index]:
          countWords(text)
      })
    );

    /*
     * Al editar una respuesta previamente
     * revisada, eliminamos completamente esa
     * revisión. Nunca guardamos undefined.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        reviews,
        index
      )
    ) {
      const nextReviews = {
        ...reviews
      };

      delete nextReviews[index];

      setReviews(
        nextReviews
      );

      setCompleted(false);

      completionNotifiedRef.current =
        false;

      /*
       * Se guarda una sola vez cuando una
       * respuesta revisada vuelve a editarse,
       * para dejar la sección nuevamente
       * incompleta.
       */
      const completedExercises =
        ejercicios.filter(
          (_, exerciseIndex) =>
            nextReviews[
              exerciseIndex
            ]?.passed === true
        ).length;

      onProgressRef.current?.({
        completed: false,
        score: null,
        totalExercises:
          ejercicios.length,
        completedExercises,
        responses:
          nextResponses,
        reviews:
          nextReviews
      });
    }
  };

  const handleReview = (
    index,
    exercise
  ) => {
    const text =
      responses[index] || "";

    const minWords =
      getMinimumWords(exercise);

    const maxWords =
      getMaximumWords(exercise);

    const criteria =
      getCriteria(exercise);

    const review =
      buildBasicFeedback({
        text,
        minWords,
        maxWords,
        criteria
      });

    setReviews(
      (previousReviews) => ({
        ...previousReviews,
        [index]: review
      })
    );
  };

  if (!ejercicios.length) {
    return null;
  }

  return (
    <>
      {ejercicios.map(
        (exercise, index) => {
          const minWords =
            getMinimumWords(
              exercise
            );

          const maxWords =
            getMaximumWords(
              exercise
            );

          const suggestedTime =
            getSuggestedTime(
              exercise
            );

          const criteria =
            getCriteria(exercise);

          const currentWords =
            wordCounts[index] || 0;

          const review =
            reviews[index];

          const isUnderMinimum =
            currentWords < minWords;

          return (
            <div
              key={
                exercise.id ||
                `writing-${index}`
              }
              className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getInstruction(
                      exercise
                    )}
                  </h3>

                  {getGuide(
                    exercise
                  ) && (
                    <p className="text-gray-600 mt-2">
                      {getGuide(
                        exercise
                      )}
                    </p>
                  )}
                </div>

                {review?.passed && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                    Sprawdzone
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3 text-sm bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4">
                <span className="font-semibold text-blue-800">
                  Minimum:{" "}
                  {minWords} słów
                </span>

                {maxWords && (
                  <span className="text-blue-700">
                    Maksimum:{" "}
                    {maxWords} słów
                  </span>
                )}

                {suggestedTime && (
                  <span className="text-blue-700">
                    Sugerowany czas:{" "}
                    {suggestedTime} minut
                  </span>
                )}
              </div>

              {criteria.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-xl mb-4">
                  <h4 className="font-semibold text-primary-600 mb-2">
                    Kryteria oceny:
                  </h4>

                  <ul className="list-disc pl-5 space-y-1">
                    {criteria.map(
                      (
                        criterion,
                        criterionIndex
                      ) => (
                        <li
                          key={
                            criterionIndex
                          }
                          className="text-gray-700"
                        >
                          {criterion}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              <textarea
                className="w-full p-4 border rounded-xl min-h-[200px] focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Wpisz swoją odpowiedź po angielsku..."
                value={
                  responses[index] ||
                  ""
                }
                onChange={(event) =>
                  handleTextChange(
                    index,
                    event.target.value
                  )
                }
              />

              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm mt-3">
                <span className="text-gray-600">
                  Liczba słów:{" "}
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
                  Wymagane minimum:{" "}
                  {minWords} słów
                </span>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() =>
                    handleReview(
                      index,
                      exercise
                    )
                  }
                  className="px-5 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
                >
                  Sprawdź odpowiedź
                </button>

                {review &&
                  !review.passed && (
                    <span className="text-sm text-gray-500 self-center">
                      Popraw odpowiedź i
                      sprawdź ponownie.
                    </span>
                  )}
              </div>

              {review && (
                <div className="mt-4 space-y-2">
                  {review.feedback.map(
                    (
                      item,
                      feedbackIndex
                    ) => (
                      <div
                        key={
                          feedbackIndex
                        }
                        className={`border p-3 rounded-xl text-sm ${getFeedbackClass(
                          item.type
                        )}`}
                      >
                        {item.text}
                      </div>
                    )
                  )}
                </div>
              )}

              <div className="mt-4 p-3 rounded-xl bg-gray-50 text-sm text-gray-600">
                To jest podstawowa
                kontrola. Szczegółowa
                korekta gramatyki,
                słownictwa i stylu może
                zostać dodana później
                przez AI lub nauczyciela.
              </div>
            </div>
          );
        }
      )}

      {completed && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 font-semibold text-green-700">
          Wszystkie zadania pisemne
          zostały sprawdzone.
        </div>
      )}
    </>
  );
};

export default WritingExercises;