// src/components/admin/AdminLessonPreview.jsx

import React from "react";

const sectionClass =
  "bg-white border border-gray-100 rounded-2xl p-4 shadow-sm";
const titleClass = "text-lg font-bold text-gray-900 mb-3";
const subtitleClass = "font-semibold text-gray-800 mb-2";
const mutedClass = "text-gray-500 italic";

const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const renderText = (value, fallback = "Brak treści.") => {
  if (typeof value === "string" || typeof value === "number") {
    return value || fallback;
  }

  if (value && typeof value === "object") {
    return (
      value.text ||
      value.titulo ||
      value.title ||
      value.pregunta ||
      value.question ||
      value.descripcion ||
      value.description ||
      JSON.stringify(value)
    );
  }

  return fallback;
};

const getQuestionText = (question = {}) =>
  typeof question === "string"
    ? question
    : question.pregunta || question.question || "Question without text";

const getCorrectAnswer = (question = {}) =>
  question.respuesta_correcta ||
  question.respuesta ||
  question.answer ||
  question.correctAnswer ||
  "";

const getOptions = (question = {}) =>
  question.opciones || question.options || [];

const AdminLessonPreview = ({ lesson }) => {
  if (!lesson) {
    return (
      <div className={sectionClass}>
        <p className={mutedClass}>Brak danych lekcji.</p>
      </div>
    );
  }

  const contenidos = safeObject(lesson.contenidos || lesson.content);
  const vocabulario = safeObject(contenidos.vocabulario);
  const gramatica = safeObject(contenidos.gramatica);

  const vocabularyItems =
    vocabulario.palabras ||
    vocabulario.items ||
    vocabulario.terms ||
    [];

  const grammarTopics = gramatica.temas || [];
  const grammarRules = gramatica.reglas || [];

  const lectura = safeObject(lesson.lectura);
  const practica = safeObject(lesson.practica_interactiva);
  const escrita = safeObject(lesson.produccion_escrita);
  const oral = safeObject(lesson.produccion_oral);
  const evaluacion = safeObject(lesson.evaluacion);
  const recursos = safeArray(lesson.recursos_adicionales);

  return (
    <div className="space-y-5 bg-gray-50 border-t pt-5">
      <section className={sectionClass}>
        <h3 className={titleClass}>Podgląd lekcji</h3>

        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <p>
            <span className="font-semibold">ID:</span>{" "}
            {lesson.id || lesson.lessonId || "N/A"}
          </p>

          <p>
            <span className="font-semibold">Poziom:</span>{" "}
            {lesson.nivel || lesson.level || "N/A"}
          </p>

          <p>
            <span className="font-semibold">Moduł:</span>{" "}
            {lesson.moduleTitle || lesson.moduleId || "N/A"}
          </p>

          <p>
            <span className="font-semibold">Status:</span>{" "}
            {lesson.status || "draft"}
          </p>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-4">
          {lesson.titulo || lesson.title || "Untitled lesson"}
        </h2>

        <p className="text-gray-600 mt-2">
          {lesson.descripcion || lesson.description || "Brak opisu."}
        </p>
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>Cele lekcji</h3>

        {safeArray(lesson.objetivos).length > 0 ? (
          <ul className="list-disc pl-5 space-y-1">
            {safeArray(lesson.objetivos).map((objective, index) => (
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
        <h3 className={titleClass}>Słownictwo</h3>

        {safeArray(vocabularyItems).length > 0 ? (
          <div className="grid md:grid-cols-2 gap-3">
            {safeArray(vocabularyItems).map((item, index) => {
              const word =
                item.palabra ||
                item.term ||
                item.termino ||
                item.word ||
                renderText(item);

              const translation =
                item.traduccion || item.translation || item.tlumaczenie || "";

              const definition =
                item.definicion || item.definition || item.meaning || "";

              const example = item.ejemplo || item.example || "";

              return (
                <article
                  key={`${word}-${index}`}
                  className="bg-gray-50 border border-gray-100 rounded-xl p-3"
                >
                  <h4 className="font-bold text-gray-900">{word}</h4>

                  {translation && (
                    <p className="text-primary-700 text-sm mt-1">
                      {translation}
                    </p>
                  )}

                  {definition && (
                    <p className="text-gray-600 text-sm mt-2">{definition}</p>
                  )}

                  {example && (
                    <p className="text-gray-500 text-sm italic mt-2">
                      {example}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className={mutedClass}>Brak słownictwa.</p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>Gramatyka</h3>

        {safeArray(grammarTopics).length > 0 && (
          <div className="mb-4">
            <h4 className={subtitleClass}>Tematy</h4>

            <ul className="list-disc pl-5 space-y-1">
              {safeArray(grammarTopics).map((topic, index) => (
                <li key={index} className="text-gray-700">
                  {renderText(topic)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {safeArray(grammarRules).length > 0 ? (
          <div className="space-y-3">
            {safeArray(grammarRules).map((rule, index) => (
              <article
                key={index}
                className="bg-gray-50 border border-gray-100 rounded-xl p-3"
              >
                <h4 className="font-bold text-gray-900">
                  {rule.titulo || rule.title || `Rule ${index + 1}`}
                </h4>

                <p className="text-gray-700 mt-2">
                  {rule.explicacion || rule.explanation || "Brak wyjaśnienia."}
                </p>

                {safeArray(rule.ejemplos || rule.examples).length > 0 && (
                  <ul className="list-disc pl-5 mt-3 space-y-1">
                    {safeArray(rule.ejemplos || rule.examples).map(
                      (example, i) => (
                        <li key={i} className="text-gray-600">
                          {typeof example === "string"
                            ? example
                            : example.frase ||
                              example.sentence ||
                              example.example ||
                              JSON.stringify(example)}
                        </li>
                      )
                    )}
                  </ul>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className={mutedClass}>Brak reguł gramatycznych.</p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>Czytanie</h3>

        {lectura.titulo || lectura.contenido ? (
          <div>
            {lectura.titulo && (
              <h4 className="font-bold text-gray-900">{lectura.titulo}</h4>
            )}

            {lectura.autor && (
              <p className="text-gray-500 italic text-sm mt-1">
                Autor: {lectura.autor}
              </p>
            )}

            <p className="text-gray-700 whitespace-pre-line mt-3">
              {lectura.contenido || "Brak tekstu czytania."}
            </p>

            {safeArray(lectura.preguntas).length > 0 && (
              <div className="mt-4">
                <h4 className={subtitleClass}>Pytania</h4>

                <ol className="list-decimal pl-5 space-y-4">
                  {safeArray(lectura.preguntas).map((question, index) => (
                    <li key={index} className="text-gray-700">
                      <p className="font-medium">
                        {getQuestionText(question)}
                      </p>

                      {safeArray(getOptions(question)).length > 0 && (
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          {safeArray(getOptions(question)).map(
                            (option, i) => (
                              <li key={i} className="text-gray-600">
                                {option}
                              </li>
                            )
                          )}
                        </ul>
                      )}

                      {getCorrectAnswer(question) && (
                        <p className="text-green-700 text-sm mt-2">
                          Poprawna odpowiedź: {getCorrectAnswer(question)}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : (
          <p className={mutedClass}>Brak sekcji czytania.</p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>Ćwiczenia interaktywne</h3>

        {safeArray(practica.ejercicios).length > 0 ? (
          <div className="space-y-4">
            {safeArray(practica.ejercicios).map((exercise, index) => (
              <article
                key={index}
                className="bg-gray-50 border border-gray-100 rounded-xl p-3"
              >
                <p className="text-xs uppercase text-primary-600 font-bold">
                  {exercise.tipo || exercise.type || "exercise"}
                </p>

                <h4 className="font-bold text-gray-900 mt-1">
                  {exercise.pregunta ||
                    exercise.question ||
                    exercise.instrucciones ||
                    exercise.instructions ||
                    `Exercise ${index + 1}`}
                </h4>

                {safeArray(exercise.opciones || exercise.options).length >
                  0 && (
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {safeArray(exercise.opciones || exercise.options).map(
                      (option, i) => (
                        <li key={i} className="text-gray-600">
                          {option}
                        </li>
                      )
                    )}
                  </ul>
                )}

                {safeArray(exercise.elementos || exercise.items).length > 0 && (
                  <p className="text-gray-600 mt-2">
                    Elementy:{" "}
                    {safeArray(exercise.elementos || exercise.items).join(
                      ", "
                    )}
                  </p>
                )}

                {exercise.respuesta_correcta || exercise.correctAnswer ? (
                  <p className="text-green-700 text-sm mt-2">
                    Poprawna odpowiedź:{" "}
                    {exercise.respuesta_correcta || exercise.correctAnswer}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className={mutedClass}>Brak ćwiczeń interaktywnych.</p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>Pisanie</h3>

        {escrita.titulo || safeArray(escrita.ejercicios).length > 0 ? (
          <div>
            {escrita.titulo && (
              <h4 className="font-bold text-gray-900">{escrita.titulo}</h4>
            )}

            {escrita.descripcion && (
              <p className="text-gray-600 mt-2">{escrita.descripcion}</p>
            )}

            {safeArray(escrita.ejercicios).length > 0 && (
              <ul className="list-disc pl-5 mt-3 space-y-2">
                {safeArray(escrita.ejercicios).map((exercise, index) => (
                  <li key={index} className="text-gray-700">
                    {renderText(exercise)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className={mutedClass}>Brak ćwiczeń pisemnych.</p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>Mówienie</h3>

        {oral.titulo || safeArray(oral.ejercicios).length > 0 ? (
          <div>
            {oral.titulo && (
              <h4 className="font-bold text-gray-900">{oral.titulo}</h4>
            )}

            {oral.descripcion && (
              <p className="text-gray-600 mt-2">{oral.descripcion}</p>
            )}

            {safeArray(oral.ejercicios).length > 0 && (
              <ul className="list-disc pl-5 mt-3 space-y-2">
                {safeArray(oral.ejercicios).map((exercise, index) => (
                  <li key={index} className="text-gray-700">
                    {renderText(exercise)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className={mutedClass}>Brak ćwiczeń ustnych.</p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>Ocena</h3>

        {evaluacion.autoevaluacion && (
          <p className="text-gray-700 mb-4">{evaluacion.autoevaluacion}</p>
        )}

        {safeArray(evaluacion.cuestionario).length > 0 ? (
          <ol className="list-decimal pl-5 space-y-4">
            {safeArray(evaluacion.cuestionario).map((question, index) => (
              <li key={index} className="text-gray-700">
                <p className="font-medium">{getQuestionText(question)}</p>

                {safeArray(getOptions(question)).length > 0 && (
                  <ul className="list-disc pl-5 mt-2">
                    {safeArray(getOptions(question)).map((option, i) => (
                      <li key={i} className="text-gray-600">
                        {option}
                      </li>
                    ))}
                  </ul>
                )}

                {getCorrectAnswer(question) && (
                  <p className="text-green-700 text-sm mt-2">
                    Poprawna odpowiedź: {getCorrectAnswer(question)}
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className={mutedClass}>Brak pytań oceniających.</p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>Materiały dodatkowe</h3>

        {recursos.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-3">
            {recursos.map((resource, index) => {
              const title =
                resource.titulo ||
                resource.title ||
                resource.nombre ||
                `Resource ${index + 1}`;

              const description =
                resource.descripcion || resource.description || "";

              const url = resource.url || resource.enlace || "";

              return (
                <article
                  key={index}
                  className="bg-gray-50 border border-gray-100 rounded-xl p-3"
                >
                  <h4 className="font-bold text-gray-900">{title}</h4>

                  {description && (
                    <p className="text-gray-600 text-sm mt-2">
                      {description}
                    </p>
                  )}

                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-primary-600 hover:text-primary-700 font-semibold text-sm mt-2 break-all"
                    >
                      {url}
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className={mutedClass}>Brak materiałów dodatkowych.</p>
        )}
      </section>

      <section className={sectionClass}>
        <h3 className={titleClass}>Podsumowanie</h3>

        {lesson.reflexion_final ? (
          <p className="text-gray-700 whitespace-pre-line">
            {lesson.reflexion_final}
          </p>
        ) : (
          <p className={mutedClass}>Brak podsumowania.</p>
        )}
      </section>
    </div>
  );
};

export default AdminLessonPreview;