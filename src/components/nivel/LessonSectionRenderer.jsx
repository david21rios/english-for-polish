// src/components/nivel/LessonSectionRenderer.jsx

import AudioPlayer from "../interactive/AudioPlayer";
import WritingExercises from "../interactive/WritingExercise";
import AudioRecorder from "../interactive/AudioRecorder";
import InteractiveQuiz from "../interactive/InteractiveQuiz";
import InteractivePractice from "../interactive/InteractivePractice";

import {
  FaBook,
  FaGraduationCap,
  FaBookReader,
  FaListAlt,
  FaLightbulb,
  FaLink,
  FaMicrophone
} from "react-icons/fa";

const cardClass =
  "w-full overflow-x-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 md:p-8";

const sectionTitleClass =
  "text-xl md:text-2xl font-bold text-gray-900 flex items-start md:items-center gap-3 mb-5 md:mb-6 leading-tight break-words";

const softBoxClass =
  "w-full overflow-hidden bg-gray-50 border border-gray-100 rounded-2xl p-4 md:p-5";

const isBeginnerLevel = (levelId = "") => {
  return ["A1", "A2", "A1-A2", "A2-B1"].includes(levelId);
};

const labelByLevel = (levelId, beginnerLabel, advancedLabel) => {
  return isBeginnerLevel(levelId) ? beginnerLabel : advancedLabel;
};

const formatReadingText = (text = "") => {
  const cleanText = text.trim();

  if (!cleanText) return [];

  const manualParagraphs = cleanText
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (manualParagraphs.length > 1) return manualParagraphs;

  const sentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length <= 3) {
    return [cleanText];
  }

  const groupedParagraphs = [];

  for (let i = 0; i < sentences.length; i += 3) {
    groupedParagraphs.push(sentences.slice(i, i + 3).join(" "));
  }

  return groupedParagraphs;
};

const normalizeQuizQuestion = (item) => ({
  pregunta: item.pregunta || item.question || "",
  respuesta_correcta:
    item.respuesta_correcta || item.respuesta || item.answer || "",
  respuestas_aceptadas: item.respuestas_aceptadas || [],
  opciones: item.opciones || item.options || [],
  pista: item.pista || ""
});

const LessonSectionRenderer = ({
  currentSection,
  lessonDetails,
  levelId,
  markSectionCompleted
}) => {
  if (!currentSection || !lessonDetails) return null;

  const beginner = isBeginnerLevel(levelId);

  switch (currentSection.id) {
    case "intro":
      return (
        <section className={cardClass}>
          <div className="text-center mb-6 md:mb-8">
            <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">
              {beginner ? "Lesson overview / Vista general" : "Vista general"}
            </p>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4 leading-tight break-words">
              {lessonDetails.titulo || "Lección sin título"}
            </h1>

            <p className="text-gray-600 text-base md:text-lg mb-4 leading-relaxed break-words">
              {lessonDetails.descripcion || "Sin descripción."}
            </p>

            <div className="inline-flex px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-medium text-sm md:text-base">
              Nivel {levelId}
            </div>
          </div>

          <div className="border-t pt-5 md:pt-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              {labelByLevel(
                levelId,
                "Learning objectives / Objetivos de aprendizaje",
                "Objetivos de aprendizaje"
              )}
            </h2>

            {lessonDetails.objetivos?.length > 0 ? (
              <ul className="space-y-2 text-gray-700">
                {lessonDetails.objetivos.map((objetivo, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary-600 font-bold shrink-0">•</span>
                    <span className="break-words">{objetivo}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Objetivos no disponibles.</p>
            )}
          </div>
        </section>
      );

    case "vocabulary": {
      const vocabulario = lessonDetails.contenidos?.vocabulario || {};
      const palabras = vocabulario.palabras || vocabulario.items || [];

      return (
        <section className={cardClass}>
          <h2 className={sectionTitleClass}>
            <FaBook className="text-primary-600 shrink-0 mt-1 md:mt-0" />
            <span>{labelByLevel(levelId, "Vocabulary / Vocabulario", "Vocabulario")}</span>
          </h2>

          {vocabulario.titulo && (
            <h3 className="text-base md:text-lg font-semibold text-primary-600 mb-5 break-words">
              {vocabulario.titulo}
            </h3>
          )}

          {palabras.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {palabras.map((palabra, index) => {
                const mainWord =
                  palabra.palabra || palabra.term || palabra.termino || "";
                const translation =
                  palabra.traduccion || palabra.translation || "";
                const definition =
                  palabra.definicion || palabra.definition || "";
                const example = palabra.ejemplo || palabra.example || "";

                return (
                  <article
                    key={`${mainWord}-${index}`}
                    className="w-full overflow-hidden bg-gray-50 border border-gray-100 rounded-2xl p-4"
                  >
                    <div className="flex justify-between gap-3 min-w-0">
                      <div className="min-w-0">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 break-words">
                          {mainWord}
                        </h3>

                        {translation && (
                          <p className="text-sm text-primary-700 font-semibold mt-1 break-words">
                            {beginner ? "Translation: " : "Traducción: "}
                            {translation}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const utterance = new SpeechSynthesisUtterance(mainWord);
                          utterance.lang = "es-ES";
                          window.speechSynthesis.speak(utterance);
                        }}
                        className="h-10 w-10 shrink-0 rounded-full bg-white text-primary-600 hover:text-primary-700 border border-gray-200"
                        title="Escuchar pronunciación"
                      >
                        🔊
                      </button>
                    </div>

                    {definition && (
                      <p className="text-sm text-gray-600 mt-3 break-words">
                        {beginner ? "Meaning: " : "Significado: "}
                        {definition}
                      </p>
                    )}

                    {example && (
                      <p className="text-sm text-gray-500 italic mt-3 break-words">
                        {beginner ? "Example: " : "Ejemplo: "}
                        {example}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">Vocabulario no disponible.</p>
          )}
        </section>
      );
    }

    case "grammar": {
      const gramatica = lessonDetails.contenidos?.gramatica || {};
      const temas = gramatica.temas || [];

      const reglas = (gramatica.reglas || []).filter((regla) => {
        return (
          regla?.titulo &&
          regla?.explicacion &&
          Array.isArray(regla?.ejemplos) &&
          regla.ejemplos.length > 0
        );
      });

      return (
        <section className={cardClass}>
          <h2 className={sectionTitleClass}>
            <FaBook className="text-primary-600 shrink-0 mt-1 md:mt-0" />
            <span>{labelByLevel(levelId, "Grammar / Gramática", "Gramática")}</span>
          </h2>

          {temas.length > 0 && (
            <div className="mb-6 md:mb-8">
              <h3 className="text-primary-600 font-semibold mb-3">
                {labelByLevel(levelId, "Topics / Temas", "Temas")}
              </h3>

              <ul className="list-disc pl-5 md:pl-6 space-y-1 text-gray-700">
                {temas.map((tema, index) => (
                  <li key={index} className="break-words">
                    {typeof tema === "string" ? tema : tema.titulo}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reglas.length > 0 ? (
            <div className="space-y-5">
              {reglas.map((regla, index) => (
                <article
                  key={`${regla.titulo}-${index}`}
                  className="w-full overflow-hidden border border-gray-200 rounded-2xl bg-white"
                >
                  <div className="flex items-start gap-3 px-4 md:px-5 py-4 bg-gray-50">
                    <span className="w-8 h-8 shrink-0 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </span>

                    <h4 className="font-bold text-gray-900 break-words">
                      {regla.titulo}
                    </h4>
                  </div>

                  <div className="p-4 md:p-5 space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-primary-600 mb-1">
                        {labelByLevel(
                          levelId,
                          "Explanation / Explicación",
                          "Explicación"
                        )}
                      </p>

                      <p className="text-gray-700 leading-relaxed break-words">
                        {regla.explicacion}
                      </p>
                    </div>

                    <div className={softBoxClass}>
                      <h5 className="font-semibold text-gray-900 mb-3">
                        {labelByLevel(levelId, "Examples / Ejemplos", "Ejemplos")}
                      </h5>

                      <ul className="space-y-3">
                        {regla.ejemplos.map((ejemplo, i) => (
                          <li key={i} className="text-gray-700 break-words">
                            <p className="font-semibold break-words">
                              {ejemplo.frase}
                            </p>

                            {ejemplo.traduccion && (
                              <p className="text-sm text-gray-600 break-words">
                                {ejemplo.traduccion}
                              </p>
                            )}

                            {ejemplo.nota && (
                              <p className="text-xs text-gray-500 mt-1 break-words">
                                {ejemplo.nota}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Gramática no disponible.</p>
          )}
        </section>
      );
    }

    case "reading": {
      const lectura = lessonDetails.lectura || {};
      const paragraphs = formatReadingText(lectura.contenido || "");
      const preguntas = lectura.preguntas || [];

      return (
        <section className={cardClass}>
          <h2 className={sectionTitleClass}>
            <FaBookReader className="text-primary-600 shrink-0 mt-1 md:mt-0" />
            <span>{labelByLevel(levelId, "Reading / Lectura", "Lectura")}</span>
          </h2>

          <div className="space-y-5 md:space-y-6 w-full overflow-hidden">
            {lectura.titulo && (
              <div className="w-full min-w-0">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 break-words">
                  {lectura.titulo}
                </h3>

                {lectura.autor && (
                  <p className="text-gray-500 italic mt-2 break-words">
                    {beginner ? "By: " : "Por: "}
                    {lectura.autor}
                  </p>
                )}
              </div>
            )}

            <div className={softBoxClass}>
              <div className="space-y-4 text-gray-800 leading-7 text-base md:text-lg break-words">
                {paragraphs.length > 0 ? (
                  paragraphs.map((paragraph, index) => (
                    <p key={index} className="break-words">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p>Contenido de lectura no disponible.</p>
                )}
              </div>

              {lectura.contenido && (
                <div className="mt-6 flex justify-center overflow-hidden">
                  <AudioPlayer
                    text={lectura.contenido}
                    label={beginner ? "Listen to reading" : "Escuchar lectura"}
                  />
                </div>
              )}
            </div>

            {preguntas.length > 0 && (
              <div className="w-full overflow-hidden border border-gray-100 rounded-2xl p-4 md:p-5 bg-white">
                <h4 className="font-semibold text-gray-900 mb-4 break-words">
                  {labelByLevel(
                    levelId,
                    "Reading questions / Preguntas de lectura",
                    "Preguntas de lectura"
                  )}
                </h4>

                <div className="w-full overflow-hidden">
                  <InteractiveQuiz
                    questions={preguntas}
                    normalizeQuestion={normalizeQuizQuestion}
                    onComplete={() => markSectionCompleted("reading")}
                  />
                </div>
              </div>
            )}

            <div className="w-full overflow-hidden">
              <h4 className="font-semibold text-gray-900 mb-3 break-words">
                {labelByLevel(
                  levelId,
                  "Practice your reading aloud:",
                  "Practica tu lectura en voz alta:"
                )}
              </h4>

              <AudioRecorder
                onRecordingComplete={(blob) => {
                  console.log("Grabación de lectura completada:", blob);
                }}
              />
            </div>
          </div>
        </section>
      );
    }

    case "practice":
      return (
        <section className={cardClass}>
          <h2 className={sectionTitleClass}>
            <FaGraduationCap className="text-primary-600 shrink-0 mt-1 md:mt-0" />
            <span>
              {labelByLevel(
                levelId,
                "Interactive practice / Práctica interactiva",
                "Práctica interactiva"
              )}
            </span>
          </h2>

          {lessonDetails.practica_interactiva?.ejercicios?.length > 0 ? (
            <div className="space-y-5 md:space-y-6 w-full overflow-hidden">
              {lessonDetails.practica_interactiva.titulo && (
                <h3 className="text-base md:text-lg font-semibold text-primary-600 break-words">
                  {lessonDetails.practica_interactiva.titulo}
                </h3>
              )}

              {lessonDetails.practica_interactiva.descripcion && (
                <p className="text-gray-600 break-words">
                  {lessonDetails.practica_interactiva.descripcion}
                </p>
              )}

              <div className="w-full overflow-hidden">
                <InteractivePractice
                  exercises={lessonDetails.practica_interactiva.ejercicios}
                  onComplete={() => markSectionCompleted("practice")}
                />
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Práctica interactiva no disponible.</p>
          )}
        </section>
      );

    case "writing":
      return (
        <section className={cardClass}>
          <h2 className={sectionTitleClass}>
            <FaGraduationCap className="text-primary-600 shrink-0 mt-1 md:mt-0" />
            <span>
              {labelByLevel(
                levelId,
                "Writing practice / Producción escrita",
                "Producción escrita"
              )}
            </span>
          </h2>

          {lessonDetails.produccion_escrita?.ejercicios?.length > 0 ? (
            <div className="space-y-5 md:space-y-6 w-full overflow-hidden">
              <div className={softBoxClass}>
                {lessonDetails.produccion_escrita.titulo && (
                  <h3 className="text-base md:text-lg font-semibold text-primary-600 mb-3 break-words">
                    {lessonDetails.produccion_escrita.titulo}
                  </h3>
                )}

                {lessonDetails.produccion_escrita.descripcion && (
                  <p className="text-gray-600 mb-4 break-words">
                    {lessonDetails.produccion_escrita.descripcion}
                  </p>
                )}

                <WritingExercises
                  ejercicios={lessonDetails.produccion_escrita.ejercicios || []}
                  onComplete={() => markSectionCompleted("writing")}
                />
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Producción escrita no disponible.</p>
          )}
        </section>
      );

    case "speaking": {
      const oralExercises = lessonDetails.produccion_oral?.ejercicios || [];

      return (
        <section className={cardClass}>
          <h2 className={sectionTitleClass}>
            <FaMicrophone className="text-primary-600 shrink-0 mt-1 md:mt-0" />
            <span>
              {labelByLevel(
                levelId,
                "Speaking practice / Producción oral",
                "Producción oral"
              )}
            </span>
          </h2>

          {oralExercises.length > 0 ? (
            <div className="space-y-5 md:space-y-6 w-full overflow-hidden">
              {lessonDetails.produccion_oral.titulo && (
                <h3 className="text-base md:text-lg font-semibold text-primary-600 break-words">
                  {lessonDetails.produccion_oral.titulo}
                </h3>
              )}

              {lessonDetails.produccion_oral.descripcion && (
                <p className="text-gray-600 break-words">
                  {lessonDetails.produccion_oral.descripcion}
                </p>
              )}

              <div className="space-y-4">
                {oralExercises.map((exercise, index) => (
                  <article
                    key={index}
                    className="w-full overflow-hidden bg-gray-50 border border-gray-100 rounded-2xl p-4 md:p-5"
                  >
                    <h4 className="font-bold text-gray-900 mb-2 break-words">
                      {beginner ? "Speaking task" : "Actividad oral"} {index + 1}
                    </h4>

                    <p className="text-gray-700 break-words">
                      {exercise.consigna ||
                        exercise.prompt ||
                        "Actividad oral sin consigna."}
                    </p>

                    {(exercise.guia || exercise.guidance) && (
                      <div className="mt-3 bg-white border border-gray-100 rounded-xl p-4 overflow-hidden">
                        <p className="text-sm font-semibold text-primary-600 mb-1">
                          {beginner ? "Guide / Guía" : "Guía"}
                        </p>

                        <p className="text-sm text-gray-600 break-words">
                          {exercise.guia || exercise.guidance}
                        </p>
                      </div>
                    )}

                    {(exercise.duracion_recomendada ||
                      exercise.tiempo_sugerido) && (
                      <div className="mt-3">
                        <span className="inline-flex max-w-full items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium break-words">
                          <span className="shrink-0">⏱</span>
                          <span className="break-words">
                            {beginner
                              ? "Suggested duration: "
                              : "Duración sugerida: "}
                            {exercise.duracion_recomendada ||
                              `${exercise.tiempo_sugerido} minuto(s)`}
                          </span>
                        </span>
                      </div>
                    )}

                    {exercise.criterios?.length > 0 && (
                      <div className="mt-4 bg-green-50 border border-green-100 rounded-xl p-4 overflow-hidden">
                        <h5 className="font-semibold text-green-700 mb-3 break-words">
                          {beginner
                            ? "Before recording, check / Antes de grabar, verifica:"
                            : "Antes de grabar, verifica:"}
                        </h5>

                        <ul className="space-y-2">
                          {exercise.criterios.map((criterio, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-gray-700"
                            >
                              <span className="text-green-600 shrink-0">☐</span>
                              <span className="break-words">{criterio}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <AudioRecorder
                exercises={oralExercises}
                onComplete={() => {
                  markSectionCompleted("speaking");
                }}
              />
            </div>
          ) : (
            <p className="text-gray-500">Producción oral no disponible.</p>
          )}
        </section>
      );
    }

    case "evaluation":
      return (
        <section className={cardClass}>
          <h2 className={sectionTitleClass}>
            <FaListAlt className="text-primary-600 shrink-0 mt-1 md:mt-0" />
            <span>{labelByLevel(levelId, "Evaluation / Evaluación", "Evaluación")}</span>
          </h2>

          {lessonDetails.evaluacion ? (
            <div className="space-y-5 md:space-y-6 w-full overflow-hidden">
              {lessonDetails.evaluacion.autoevaluacion && (
                <div className={softBoxClass}>
                  <h3 className="text-base md:text-lg font-semibold text-primary-600 mb-2">
                    {labelByLevel(
                      levelId,
                      "Self-assessment / Autoevaluación",
                      "Autoevaluación"
                    )}
                  </h3>

                  <p className="text-gray-600 break-words">
                    {lessonDetails.evaluacion.autoevaluacion}
                  </p>
                </div>
              )}

              {lessonDetails.evaluacion.cuestionario?.length > 0 && (
                <div className={softBoxClass}>
                  <h3 className="text-base md:text-lg font-semibold text-primary-600 mb-3">
                    {labelByLevel(levelId, "Quiz / Cuestionario", "Cuestionario")}
                  </h3>

                  <div className="w-full overflow-hidden">
                    <InteractiveQuiz
                      questions={lessonDetails.evaluacion.cuestionario}
                      onComplete={() => markSectionCompleted("evaluation")}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Evaluación no disponible.</p>
          )}
        </section>
      );

    case "resources": {
      const recursos = lessonDetails.recursos_adicionales || [];

      return (
        <section className={cardClass}>
          <h2 className={sectionTitleClass}>
            <FaLink className="text-primary-600 shrink-0 mt-1 md:mt-0" />
            <span>
              {labelByLevel(
                levelId,
                "Additional resources / Recursos adicionales",
                "Recursos adicionales"
              )}
            </span>
          </h2>

          <p className="text-gray-600 mb-5 break-words">
            {beginner
              ? "These resources can help you practice and understand the lesson better."
              : "Estos recursos te ayudarán a practicar y profundizar en la lección."}
          </p>

          {recursos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recursos.map((recurso, index) => {
                const title = recurso.titulo || recurso.title || "Recurso";
                const description =
                  recurso.descripcion || recurso.description || "";
                const type = recurso.tipo || recurso.type || "";
                const audience = recurso.audiencia || recurso.audience || "";
                const url = recurso.url || "";

                return (
                  <article
                    key={`${title}-${index}`}
                    className="w-full overflow-hidden border border-gray-100 rounded-2xl p-4 md:p-5 bg-white hover:bg-gray-50"
                  >
                    <h3 className="font-bold text-gray-900 break-words">
                      {title}
                    </h3>

                    {description && (
                      <p className="text-sm text-gray-600 mt-2 break-words">
                        {description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-4">
                      {type && (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-700 font-semibold break-words">
                          {beginner ? "Type: " : "Tipo: "}
                          {type}
                        </span>
                      )}

                      {audience && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold break-words">
                          {beginner ? "Audience: " : "Audiencia: "}
                          {audience}
                        </span>
                      )}
                    </div>

                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex mt-4 text-primary-600 font-semibold hover:text-primary-700 break-all"
                      >
                        {beginner ? "Open resource ↗" : "Abrir recurso ↗"}
                      </a>
                    ) : (
                      <p className="mt-4 text-sm text-gray-500">
                        {beginner
                          ? "Offline or teacher-guided resource."
                          : "Recurso offline o guiado por el docente."}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-700 break-words">
              Recursos adicionales no disponibles para esta lección.
            </div>
          )}
        </section>
      );
    }

    case "reflection":
      return (
        <section className={cardClass}>
          <h2 className={sectionTitleClass}>
            <FaLightbulb className="text-primary-600 shrink-0 mt-1 md:mt-0" />
            <span>{labelByLevel(levelId, "Final reflection / Cierre", "Cierre")}</span>
          </h2>

          {lessonDetails.reflexion_final ? (
            <p className="text-gray-600 leading-relaxed break-words">
              {lessonDetails.reflexion_final}
            </p>
          ) : (
            <p className="text-gray-500">Reflexión final no disponible.</p>
          )}
        </section>
      );

    default:
      return null;
  }
};

export default LessonSectionRenderer;