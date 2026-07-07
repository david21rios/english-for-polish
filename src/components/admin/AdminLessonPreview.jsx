// src/components/admin/AdminLessonPreview.jsx

import { useMemo } from "react";
import { normalizeLesson } from "../../utils/lessonNormalizer";

const sectionClass =
  "bg-white border border-gray-100 rounded-2xl p-4 shadow-sm";

const titleClass = "text-lg font-bold text-gray-900 mb-3";
const subtitleClass = "font-semibold text-gray-800 mb-2";
const mutedClass = "text-gray-500 italic";

const safeArray = (value) => (Array.isArray(value) ? value : []);

const renderText = (value, fallback = "Brak treści.") => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim() || fallback;
  }

  if (value && typeof value === "object") {
    return (
      value.text ||
      value.title ||
      value.question ||
      value.description ||
      value.term ||
      value.translation ||
      fallback
    );
  }

  return fallback;
};

const renderAnswerValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => renderText(item)).join(", ");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, answer]) => `${key}: ${renderText(answer)}`)
      .join(", ");
  }

  return renderText(value, "");
};

const getExerciseTypeLabel = (type = "") => {
  const labels = {
    multiple_choice: "Wybór wielokrotny",
    fill_blank: "Uzupełnianie luk",
    matching: "Dopasowywanie",
    ordering: "Układanie w kolejności"
  };

  return labels[type] || type || "Ćwiczenie";
};

const QuestionPreview = ({ question, index }) => {
  const options = safeArray(question?.options);
  const acceptedAnswers = safeArray(question?.acceptedAnswers);

  return (
    <li className="text-gray-700">
      <p className="font-medium">
        {question?.question || `Pytanie ${index + 1}`}
      </p>

      {options.length > 0 && (
        <ul className="list-disc pl-5 mt-2 space-y-1">
          {options.map((option, optionIndex) => (
            <li
              key={`${index}-${optionIndex}`}
              className="text-gray-600"
            >
              {renderText(option)}
            </li>
          ))}
        </ul>
      )}

      {question?.correctAnswer && (
        <p className="text-green-700 text-sm mt-2">
          Poprawna odpowiedź: {renderText(question.correctAnswer)}
        </p>
      )}

      {acceptedAnswers.length > 0 && (
        <p className="text-blue-700 text-sm mt-2">
          Akceptowane odpowiedzi:{" "}
          {acceptedAnswers.map((answer) => renderText(answer)).join(", ")}
        </p>
      )}

      {question?.feedback && (
        <p className="text-gray-500 text-sm mt-2">
          Informacja zwrotna: {question.feedback}
        </p>
      )}
    </li>
  );
};

const PracticeExercisePreview = ({ exercise, index }) => {
  const options = safeArray(exercise?.options);
  const words = safeArray(exercise?.words);
  const leftItems = safeArray(exercise?.leftItems);
  const rightItems = safeArray(exercise?.rightItems);
  const items = safeArray(exercise?.items);
  const correctOrder = safeArray(exercise?.correctOrder);

  return (
    <article className="bg-gray-50 border border-gray-100 rounded-xl p-3">
      <p className="text-xs uppercase text-primary-600 font-bold">
        {getExerciseTypeLabel(exercise?.type)}
      </p>

      {exercise?.instruction && (
        <p className="text-gray-600 text-sm mt-2">
          {exercise.instruction}
        </p>
      )}

      {(exercise?.question || exercise?.text) && (
        <h4 className="font-bold text-gray-900 mt-2">
          {exercise.question || exercise.text}
        </h4>
      )}

      {!exercise?.question &&
        !exercise?.text &&
        !exercise?.instruction && (
          <h4 className="font-bold text-gray-900 mt-2">
            Ćwiczenie {index + 1}
          </h4>
        )}

      {options.length > 0 && (
        <ul className="list-disc pl-5 mt-3 space-y-1">
          {options.map((option, optionIndex) => (
            <li
              key={`${index}-option-${optionIndex}`}
              className="text-gray-600"
            >
              {renderText(option)}
            </li>
          ))}
        </ul>
      )}

      {words.length > 0 && (
        <p className="text-gray-600 mt-3">
          Słowa: {words.map((word) => renderText(word)).join(", ")}
        </p>
      )}

      {(leftItems.length > 0 || rightItems.length > 0) && (
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <div>
            <p className="font-semibold text-gray-800 mb-1">
              Lewa kolumna
            </p>

            <ul className="list-disc pl-5 space-y-1">
              {leftItems.map((item, itemIndex) => (
                <li
                  key={`${index}-left-${itemIndex}`}
                  className="text-gray-600"
                >
                  {renderText(item)}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-gray-800 mb-1">
              Prawa kolumna
            </p>

            <ul className="list-disc pl-5 space-y-1">
              {rightItems.map((item, itemIndex) => (
                <li
                  key={`${index}-right-${itemIndex}`}
                  className="text-gray-600"
                >
                  {renderText(item)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <p className="text-gray-600 mt-3">
          Elementy: {items.map((item) => renderText(item)).join(", ")}
        </p>
      )}

      {exercise?.correctAnswer && (
        <p className="text-green-700 text-sm mt-3">
          Poprawna odpowiedź:{" "}
          {renderAnswerValue(exercise.correctAnswer)}
        </p>
      )}

      {exercise?.correctAnswers &&
        Object.keys(exercise.correctAnswers).length > 0 && (
          <p className="text-green-700 text-sm mt-3">
            Poprawne odpowiedzi:{" "}
            {renderAnswerValue(exercise.correctAnswers)}
          </p>
        )}

      {exercise?.correctPairs &&
        Object.keys(exercise.correctPairs).length > 0 && (
          <p className="text-green-700 text-sm mt-3">
            Poprawne pary: {renderAnswerValue(exercise.correctPairs)}
          </p>
        )}

      {correctOrder.length > 0 && (
        <p className="text-green-700 text-sm mt-3">
          Poprawna kolejność:{" "}
          {correctOrder.map((item) => renderText(item)).join(" → ")}
        </p>
      )}
    </article>
  );
};

const AdminLessonPreview = ({ lesson }) => {
  const canonicalLesson = useMemo(() => {
    if (!lesson) return null;

    return normalizeLesson(lesson).lessonData;
  }, [lesson]);

  if (!canonicalLesson) {
    return (
      <div className={sectionClass}>
        <p className={mutedClass}>Brak danych lekcji.</p>
      </div>
    );
  }

  const {
    id,
    lessonId,
    title,
    description,
    level,
    moduleId,
    moduleTitle,
    orderInModule,
    status,
    ageGroup,
    objectives,
    intro,
    vocabulary,
    grammar,
    reading,
    practice,
    writing,
    speaking,
    evaluation,
    resources,
    reflection
  } = canonicalLesson;

  const vocabularyItems = safeArray(vocabulary?.items);
  const grammarRules = safeArray(grammar?.rules);
  const grammarExamples = safeArray(grammar?.examples);
  const readingQuestions = safeArray(reading?.questions);
  const practiceExercises = safeArray(practice?.exercises);
  const writingActivities = safeArray(writing?.activities);
  const speakingActivities = safeArray(speaking?.activities);
  const evaluationQuestions = safeArray(evaluation?.questions);
  const additionalResources = safeArray(resources);

  return (
    <div className="space-y-5 bg-gray-50 border-t pt-5">
      <section className={sectionClass}>
        <h3 className={titleClass}>Podgląd lekcji</h3>

        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <p>
            <span className="font-semibold">ID:</span>{" "}
            {lessonId || id || "N/A"}
          </p>

          <p>
            <span className="font-semibold">Poziom:</span>{" "}
            {level || "N/A"}
          </p>

          <p>
            <span className="font-semibold">Moduł:</span>{" "}
            {moduleTitle || moduleId || "N/A"}
          </p>

          <p>
            <span className="font-semibold">Kolejność:</span>{" "}
            {orderInModule || "N/A"}
          </p>

          <p>
            <span className="font-semibold">Status:</span>{" "}
            {status || "draft"}
          </p>

          <p>
            <span className="font-semibold">Grupa wiekowa:</span>{" "}
            {ageGroup || "all"}
          </p>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-4">
          {title || "Lekcja bez tytułu"}
        </h2>

        <p className="text-gray-600 mt-2">
          {description || "Brak opisu."}
        </p>
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>
          {intro?.title || "Wprowadzenie"}
        </h3>

        {intro?.content ? (
          <p className="text-gray-700 whitespace-pre-line">
            {intro.content}
          </p>
        ) : (
          <p className={mutedClass}>Brak wprowadzenia.</p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>Cele lekcji</h3>

        {safeArray(objectives).length > 0 ? (
          <ul className="list-disc pl-5 space-y-1">
            {safeArray(objectives).map((objective, index) => (
              <li key={index} className="text-gray-700">
                {renderText(objective)}
              </li>
            ))}
          </ul>
        ) : (
          <p className={mutedClass}>Brak celów lekcji.</p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>
          {vocabulary?.title || "Słownictwo"}
        </h3>

        {vocabularyItems.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-3">
            {vocabularyItems.map((item, index) => (
              <article
                key={`${item.term || "term"}-${index}`}
                className="bg-gray-50 border border-gray-100 rounded-xl p-3"
              >
                <h4 className="font-bold text-gray-900">
                  {item.term || `Słowo ${index + 1}`}
                </h4>

                {item.translation && (
                  <p className="text-primary-700 text-sm mt-1">
                    {item.translation}
                  </p>
                )}

                {item.definition && (
                  <p className="text-gray-600 text-sm mt-2">
                    {item.definition}
                  </p>
                )}

                {item.example && (
                  <p className="text-gray-500 text-sm italic mt-2">
                    {item.example}
                  </p>
                )}

                {item.audio && (
                  <audio
                    controls
                    src={item.audio}
                    className="w-full mt-3"
                  />
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className={mutedClass}>Brak słownictwa.</p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>
          {grammar?.title || "Gramatyka"}
        </h3>

        {grammar?.explanation && (
          <p className="text-gray-700 whitespace-pre-line mb-4">
            {grammar.explanation}
          </p>
        )}

        {grammarRules.length > 0 && (
          <div className="mb-5">
            <h4 className={subtitleClass}>Reguły</h4>

            <ul className="list-disc pl-5 space-y-2">
              {grammarRules.map((rule, index) => (
                <li key={index} className="text-gray-700">
                  {renderText(rule)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {grammarExamples.length > 0 && (
          <div>
            <h4 className={subtitleClass}>Przykłady</h4>

            <ul className="list-disc pl-5 space-y-2">
              {grammarExamples.map((example, index) => (
                <li key={index} className="text-gray-600">
                  {renderText(example)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!grammar?.explanation &&
          grammarRules.length === 0 &&
          grammarExamples.length === 0 && (
            <p className={mutedClass}>
              Brak treści gramatycznych.
            </p>
          )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>
          {reading?.title || "Czytanie"}
        </h3>

        {reading?.text ? (
          <>
            {reading.author && (
              <p className="text-gray-500 italic text-sm">
                Autor: {reading.author}
              </p>
            )}

            <p className="text-gray-700 whitespace-pre-line mt-3">
              {reading.text}
            </p>

            {readingQuestions.length > 0 && (
              <div className="mt-5">
                <h4 className={subtitleClass}>Pytania</h4>

                <ol className="list-decimal pl-5 space-y-4">
                  {readingQuestions.map((question, index) => (
                    <QuestionPreview
                      key={`${question.question}-${index}`}
                      question={question}
                      index={index}
                    />
                  ))}
                </ol>
              </div>
            )}
          </>
        ) : (
          <p className={mutedClass}>Brak sekcji czytania.</p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>
          {practice?.title || "Ćwiczenia interaktywne"}
        </h3>

        {practice?.description && (
          <p className="text-gray-600 mb-4">
            {practice.description}
          </p>
        )}

        {practiceExercises.length > 0 ? (
          <div className="space-y-4">
            {practiceExercises.map((exercise, index) => (
              <PracticeExercisePreview
                key={`${exercise.type}-${index}`}
                exercise={exercise}
                index={index}
              />
            ))}
          </div>
        ) : (
          <p className={mutedClass}>
            Brak ćwiczeń interaktywnych.
          </p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>
          {writing?.title || "Pisanie"}
        </h3>

        {writing?.description && (
          <p className="text-gray-600 mb-4">
            {writing.description}
          </p>
        )}

        {writingActivities.length > 0 ? (
          <div className="space-y-4">
            {writingActivities.map((activity, index) => (
              <article
                key={index}
                className="bg-gray-50 border border-gray-100 rounded-xl p-3"
              >
                <p className="font-semibold text-gray-900">
                  {activity.instruction ||
                    `Ćwiczenie pisemne ${index + 1}`}
                </p>

                {activity.prompt && (
                  <p className="text-gray-700 mt-2">
                    {activity.prompt}
                  </p>
                )}

                {activity.guide && (
                  <p className="text-gray-500 text-sm mt-2">
                    Wskazówka: {activity.guide}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                  {activity.minimumWords > 0 && (
                    <span>
                      Minimum słów: {activity.minimumWords}
                    </span>
                  )}

                  {activity.maximumWords > 0 && (
                    <span>
                      Maksimum słów: {activity.maximumWords}
                    </span>
                  )}

                  {activity.suggestedTimeMinutes > 0 && (
                    <span>
                      Sugerowany czas:{" "}
                      {activity.suggestedTimeMinutes} min
                    </span>
                  )}
                </div>

                {safeArray(activity.criteria).length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-gray-800 text-sm">
                      Kryteria
                    </p>

                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      {safeArray(activity.criteria).map(
                        (criterion, criterionIndex) => (
                          <li
                            key={criterionIndex}
                            className="text-gray-600 text-sm"
                          >
                            {renderText(criterion)}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className={mutedClass}>Brak ćwiczeń pisemnych.</p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>
          {speaking?.title || "Mówienie"}
        </h3>

        {speaking?.description && (
          <p className="text-gray-600 mb-4">
            {speaking.description}
          </p>
        )}

        {speakingActivities.length > 0 ? (
          <div className="space-y-4">
            {speakingActivities.map((activity, index) => (
              <article
                key={index}
                className="bg-gray-50 border border-gray-100 rounded-xl p-3"
              >
                <p className="font-semibold text-gray-900">
                  {activity.instruction ||
                    `Ćwiczenie ustne ${index + 1}`}
                </p>

                {activity.prompt && (
                  <p className="text-gray-700 mt-2">
                    {activity.prompt}
                  </p>
                )}

                {activity.guide && (
                  <p className="text-gray-500 text-sm mt-2">
                    Wskazówka: {activity.guide}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                  {activity.minimumSeconds > 0 && (
                    <span>
                      Minimalny czas: {activity.minimumSeconds} s
                    </span>
                  )}

                  {activity.suggestedTimeMinutes > 0 && (
                    <span>
                      Sugerowany czas:{" "}
                      {activity.suggestedTimeMinutes} min
                    </span>
                  )}
                </div>

                {safeArray(activity.criteria).length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-gray-800 text-sm">
                      Kryteria
                    </p>

                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      {safeArray(activity.criteria).map(
                        (criterion, criterionIndex) => (
                          <li
                            key={criterionIndex}
                            className="text-gray-600 text-sm"
                          >
                            {renderText(criterion)}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className={mutedClass}>Brak ćwiczeń ustnych.</p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>
          {evaluation?.title || "Ocena"}
        </h3>

        {evaluation?.selfAssessment && (
          <p className="text-gray-700 mb-4">
            {evaluation.selfAssessment}
          </p>
        )}

        {evaluationQuestions.length > 0 ? (
          <ol className="list-decimal pl-5 space-y-4">
            {evaluationQuestions.map((question, index) => (
              <QuestionPreview
                key={`${question.question}-${index}`}
                question={question}
                index={index}
              />
            ))}
          </ol>
        ) : (
          <p className={mutedClass}>Brak pytań oceniających.</p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>Materiały dodatkowe</h3>

        {additionalResources.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-3">
            {additionalResources.map((resource, index) => {
              if (typeof resource === "string") {
                return (
                  <article
                    key={index}
                    className="bg-gray-50 border border-gray-100 rounded-xl p-3"
                  >
                    <p className="text-gray-700">{resource}</p>
                  </article>
                );
              }

              const resourceTitle =
                resource.title || `Materiał ${index + 1}`;

              const resourceDescription =
                resource.description || "";

              const resourceUrl = resource.url || "";

              return (
                <article
                  key={index}
                  className="bg-gray-50 border border-gray-100 rounded-xl p-3"
                >
                  <h4 className="font-bold text-gray-900">
                    {resourceTitle}
                  </h4>

                  {resourceDescription && (
                    <p className="text-gray-600 text-sm mt-2">
                      {resourceDescription}
                    </p>
                  )}

                  {resourceUrl && (
                    <a
                      href={resourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-primary-600 hover:text-primary-700 font-semibold text-sm mt-2 break-all"
                    >
                      Otwórz materiał
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className={mutedClass}>
            Brak materiałów dodatkowych.
          </p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>Podsumowanie</h3>

        {reflection ? (
          <p className="text-gray-700 whitespace-pre-line">
            {reflection}
          </p>
        ) : (
          <p className={mutedClass}>Brak podsumowania.</p>
        )}
      </section>
    </div>
  );
};

export default AdminLessonPreview;