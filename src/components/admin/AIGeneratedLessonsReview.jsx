// src/components/admin/AIGeneratedLessonsReview.jsx

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import {
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaEye,
  FaSpinner,
  FaTimesCircle
} from "react-icons/fa";

import { db, auth } from "../../firebase";
import { cleanLessonData } from "../../utils/lessonStructure";

const AIGeneratedLessonsReview = ({ onPublished }) => {
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showTechnicalJson, setShowTechnicalJson] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadGeneratedLessons = async () => {
    try {
      setLoading(true);
      setError("");

      const lessonsRef = collection(db, "aiGeneratedLessons");
      const lessonsQuery = query(lessonsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(lessonsQuery);

      const data = snapshot.docs.map((item) => ({
        docId: item.id,
        ...item.data()
      }));

      setLessons(data);
    } catch (err) {
      console.error("Error loading AI generated lessons:", err);
      setError("No se pudieron cargar las lecciones generadas por IA.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGeneratedLessons();
  }, []);

  const getVisibleLessons = () => {
    return lessons.filter((lesson) => {
      const rootStatus = lesson.status || "";
      const metadataStatus = lesson.metadata?.status || "";

      return (
        rootStatus === "pending_review" ||
        metadataStatus === "pending_review"
      );
    });
  };

  const handleReject = async (lesson) => {
    const confirmReject = window.confirm(
      `¿Seguro que deseas rechazar la lección "${
        lesson.lessonData?.titulo || lesson.docId
      }"?`
    );

    if (!confirmReject) return;

    try {
      setProcessingId(lesson.docId);
      setError("");
      setSuccessMessage("");

      await updateDoc(doc(db, "aiGeneratedLessons", lesson.docId), {
        status: "rejected",
        "metadata.status": "rejected",
        rejectedBy: auth.currentUser?.uid || null,
        rejectedByEmail: auth.currentUser?.email || null,
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSuccessMessage("Lección rechazada correctamente.");
      setSelectedLesson(null);
      await loadGeneratedLessons();
    } catch (err) {
      console.error("Error rejecting AI lesson:", err);
      setError("No se pudo rechazar la lección.");
    } finally {
      setProcessingId("");
    }
  };

  const handlePublish = async (lesson) => {
    const lessonData = lesson.lessonData;

    if (!lessonData?.id || !lessonData?.level) {
      setError("La lección generada no tiene ID o nivel válido.");
      return;
    }

    const confirmPublish = window.confirm(
      `¿Publicar la lección "${
        lessonData.titulo || lessonData.id
      }" en el nivel ${lessonData.level}?`
    );

    if (!confirmPublish) return;

    try {
      setProcessingId(lesson.docId);
      setError("");
      setSuccessMessage("");
      const normalizedLessonData = normalizeAIGeneratedLessonForApp(lessonData);
      const cleanedLesson = cleanLessonData({
        ...normalizedLessonData,
        id: normalizedLessonData.id,
        lessonId: normalizedLessonData.lessonId || normalizedLessonData.id,
        nivel: normalizedLessonData.nivel || normalizedLessonData.level,
        level: normalizedLessonData.level || normalizedLessonData.nivel,
        status: "draft",
        generatedByAI: true,
        approvedByTeacher: true,
        approvedAt: new Date().toISOString()
      });

      const levelId = cleanedLesson.level || cleanedLesson.nivel;
      const lessonId = cleanedLesson.id;

      await setDoc(
        doc(db, "levels", levelId, "lessons", lessonId),
        {
          ...cleanedLesson,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        },
        { merge: true }
      );

      await updateDoc(doc(db, "aiGeneratedLessons", lesson.docId), {
        status: "published",
        "metadata.status": "published",
        approvedBy: auth.currentUser?.uid || null,
        approvedByEmail: auth.currentUser?.email || null,
        approvedAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSuccessMessage(
        "Lección publicada correctamente como borrador en Gestión de Lecciones."
      );

      setSelectedLesson(null);
      await loadGeneratedLessons();

      if (onPublished) {
        onPublished();
      }
    } catch (err) {
      console.error("Error publishing AI lesson:", err);
      setError("No se pudo publicar la lección generada.");
    } finally {
      setProcessingId("");
    }
  };

  const visibleLessons = getVisibleLessons();

  if (loading) {
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 text-gray-600">
          <FaSpinner className="animate-spin" />
          Cargando lecciones generadas por IA...
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Lecciones IA pendientes de revisión
          </h2>

          <p className="text-sm text-gray-600 mt-1">
            Revisa, rechaza o publica las lecciones generadas por agentes IA.
          </p>
        </div>

        <button
          type="button"
          onClick={loadGeneratedLessons}
          className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-semibold"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-700 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-100 text-green-700 rounded-xl p-3 text-sm">
          {successMessage}
        </div>
      )}

      {visibleLessons.length === 0 ? (
        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-xl">
          No hay lecciones pendientes generadas por IA.
        </div>
      ) : (
        <div className="space-y-4">
          {visibleLessons.map((lesson) => {
            const lessonData = lesson.lessonData || {};
            const isProcessing = processingId === lesson.docId;

            return (
              <article
                key={lesson.docId}
                className="border border-gray-100 rounded-2xl p-4 bg-gray-50"
              >
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {lessonData.titulo || "Lección sin título"}
                    </h3>

                    <p className="text-sm text-gray-600 mt-1">
                      ID: {lessonData.id || lessonData.lessonId} · Nivel:{" "}
                      {lessonData.level || lessonData.nivel} · Edad:{" "}
                      {lessonData.ageGroup || "all"}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      Idioma objetivo:{" "}
                      {lesson.metadata?.targetLanguage || "N/A"} · Base:{" "}
                      {lesson.metadata?.baseLanguage || "N/A"}
                    </p>

                    <p className="text-sm text-gray-700 mt-2">
                      {lessonData.descripcion || "Sin descripción"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLesson(
                          selectedLesson?.docId === lesson.docId
                            ? null
                            : lesson
                        );
                        setShowTechnicalJson(false);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-sm font-semibold"
                    >
                      <FaEye />
                      Ver
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePublish(lesson)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 text-sm font-semibold disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaCheckCircle />
                      )}
                      Publicar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReject(lesson)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm font-semibold disabled:opacity-50"
                    >
                      <FaTimesCircle />
                      Rechazar
                    </button>
                  </div>
                </div>

                {selectedLesson?.docId === lesson.docId && (
                  <GeneratedLessonPreview
                    lesson={lesson}
                    showTechnicalJson={showTechnicalJson}
                    onToggleJson={() =>
                      setShowTechnicalJson((prev) => !prev)
                    }
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

const GeneratedLessonPreview = ({
  lesson,
  showTechnicalJson,
  onToggleJson
}) => {
  const lessonData = lesson.lessonData || {};
  const auditReport = lesson.auditReport || {};

  return (
    <div className="mt-5 bg-white border border-gray-100 rounded-2xl p-5 space-y-5">
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5">
        <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
          Vista previa de la lección
        </p>

        <h3 className="text-2xl font-bold text-gray-900 mt-2">
          {lessonData.titulo || "Sin título"}
        </h3>

        <p className="text-gray-700 mt-2">
          {lessonData.descripcion || "Sin descripción"}
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
            Nivel {lessonData.level || lessonData.nivel}
          </span>

          <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
            Edad: {lessonData.ageGroup || "all"}
          </span>

          <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
            {lesson.metadata?.targetLanguage || "Target N/A"}
          </span>

          <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
            Base: {lesson.metadata?.baseLanguage || "N/A"}
          </span>
        </div>
      </div>

      <PreviewSection title="Objetivos">
        <ul className="list-disc pl-5 space-y-1">
          {(lessonData.objetivos || []).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </PreviewSection>

      <PreviewSection title="Vocabulario">
        <div className="grid md:grid-cols-2 gap-3">
          {(lessonData.contenidos?.vocabulario?.items || []).map(
            (item, index) => (
              <div
                key={index}
                className="border border-gray-100 rounded-xl p-3 bg-gray-50"
              >
                <p className="font-semibold text-gray-900">{item.term}</p>
                <p className="text-sm text-gray-600">{item.translation}</p>
                <p className="text-sm text-gray-500 mt-1">{item.example}</p>
              </div>
            )
          )}
        </div>
      </PreviewSection>

      <PreviewSection title="Gramática">
        {(lessonData.contenidos?.gramatica?.reglas || []).map(
          (regla, index) => (
            <div
              key={index}
              className="mb-4 border border-gray-100 rounded-xl p-4 bg-gray-50"
            >
              <h5 className="font-bold text-gray-900 mb-2">
                {regla.titulo}
              </h5>
          
              <p className="text-gray-700 mb-3">
                {regla.explicacion}
              </p>
          
              {(regla.ejemplos || []).map((ejemplo, idx) => (
                <div
                  key={idx}
                  className="ml-4 mb-2"
                >
                  <p className="font-medium">
                    {ejemplo.frase}
                  </p>
              
                  <p className="text-sm text-gray-600">
                    {ejemplo.traduccion}
                  </p>
              
                  {ejemplo.nota && (
                    <p className="text-xs text-gray-500">
                      {ejemplo.nota}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </PreviewSection>

      <PreviewSection title="Lectura">
        <h4 className="font-semibold text-gray-900">
          {lessonData.lectura?.titulo || "Lectura"}
        </h4>

        <p className="text-gray-700 mt-2 whitespace-pre-wrap">
          {lessonData.lectura?.contenido || "Sin contenido de lectura."}
        </p>

        {(lessonData.lectura?.preguntas || []).length > 0 && (
          <div className="mt-4 space-y-2">
            {(lessonData.lectura?.preguntas || []).map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 border border-gray-100 rounded-xl p-3"
              >
                <p className="font-medium text-gray-900">
                  {item.question}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Respuesta: {item.answer}
                </p>
              </div>
            ))}
          </div>
        )}
      </PreviewSection>

      <PreviewExercises
        title="Práctica interactiva"
        block={lessonData.practica_interactiva}
      />

      <PreviewExercises
        title="Producción escrita"
        block={lessonData.produccion_escrita}
      />

      <PreviewExercises
        title="Producción oral"
        block={lessonData.produccion_oral}
      />

      <PreviewEvaluation evaluation={lessonData.evaluacion} />

      <PreviewSection title="Reflexión final">
        <p className="text-gray-700">
          {lessonData.reflexion_final || "Sin reflexión final."}
        </p>
      </PreviewSection>

      <PreviewSection title="Auditoría IA">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <AuditBadge label="CEFR" value={auditReport.cefrAlignment} />
          <AuditBadge label="Idioma" value={auditReport.languageAccuracy} />
          <AuditBadge
            label="Localización"
            value={auditReport.culturalLocalization}
          />
          <AuditBadge label="JSON" value={auditReport.jsonValidation} />
        </div>

        {(auditReport.warnings || []).length > 0 && (
          <div className="mt-4 text-sm text-yellow-700">
            Advertencias: {(auditReport.warnings || []).join(", ")}
          </div>
        )}

        {(auditReport.errors || []).length > 0 && (
          <div className="mt-4 text-sm text-red-700">
            Errores: {(auditReport.errors || []).join(", ")}
          </div>
        )}
      </PreviewSection>

      <div>
        <button
          type="button"
          onClick={onToggleJson}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-semibold"
        >
          {showTechnicalJson ? <FaChevronUp /> : <FaChevronDown />}
          {showTechnicalJson ? "Ocultar JSON técnico" : "Ver JSON técnico"}
        </button>

        {showTechnicalJson && (
          <pre className="mt-4 bg-gray-900 text-gray-100 rounded-xl p-4 overflow-auto text-xs max-h-[420px]">
            {JSON.stringify(lesson, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

const PreviewSection = ({ title, children }) => {
  return (
    <section className="border border-gray-100 rounded-2xl p-4">
      <h4 className="font-bold text-gray-900 mb-3">{title}</h4>
      <div className="text-gray-700">{children}</div>
    </section>
  );
};

const PreviewExercises = ({ title, block }) => {
  if (!block) return null;

  return (
    <PreviewSection title={title}>
      <p className="text-gray-600 mb-3">
        {block.descripcion || "Sin descripción."}
      </p>

      <div className="space-y-3">
        {(block.ejercicios || []).map((item, index) => (
          <div
            key={index}
            className="bg-gray-50 border border-gray-100 rounded-xl p-3"
          >
            <p className="font-medium text-gray-900">
              {item.question || item.prompt || "Ejercicio"}
            </p>

            {item.options && (
              <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
                {item.options.map((option, optionIndex) => (
                  <li key={optionIndex}>{option}</li>
                ))}
              </ul>
            )}

            {item.guidance && (
              <p className="text-sm text-gray-600 mt-2">
                Guía: {item.guidance}
              </p>
            )}

            {item.answer && (
              <p className="text-sm text-green-700 mt-2">
                Respuesta: {item.answer}
              </p>
            )}
          </div>
        ))}
      </div>
    </PreviewSection>
  );
};

const PreviewEvaluation = ({ evaluation }) => {
  if (!evaluation) return null;

  return (
    <PreviewSection title="Evaluación">
      <p className="text-gray-700 mb-3">
        {evaluation.autoevaluacion || "Sin autoevaluación."}
      </p>

      <div className="space-y-3">
        {(evaluation.cuestionario || []).map((item, index) => (
          <div
            key={index}
            className="bg-gray-50 border border-gray-100 rounded-xl p-3"
          >
            <p className="font-medium text-gray-900">
              {item.question}
            </p>

            {item.options && (
              <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
                {item.options.map((option, optionIndex) => (
                  <li key={optionIndex}>{option}</li>
                ))}
              </ul>
            )}

            <p className="text-sm text-green-700 mt-2">
              Respuesta: {item.answer}
            </p>
          </div>
        ))}
      </div>
    </PreviewSection>
  );
};

const AuditBadge = ({ label, value }) => {
  const passed = value === "passed";

  return (
    <div
      className={`rounded-xl p-3 text-sm font-semibold ${
        passed
          ? "bg-green-50 text-green-700 border border-green-100"
          : "bg-yellow-50 text-yellow-700 border border-yellow-100"
      }`}
    >
      {label}: {value || "pending"}
    </div>
  );
};

const normalizeAIGeneratedLessonForApp = (lessonData = {}) => {
  const vocabularyItems =
    lessonData.contenidos?.vocabulario?.items ||
    lessonData.contenidos?.vocabulario?.palabras ||
    [];

  const grammarExamples =
    lessonData.contenidos?.gramatica?.examples ||
    lessonData.contenidos?.gramatica?.ejemplos ||
    [];

  const interactivePracticeExercises =
    lessonData.practica_interactiva?.ejercicios || [];

  const normalizedPracticeExercises =
    interactivePracticeExercises.map(normalizeExerciseForApp);

  return {
    ...lessonData,

    contenidos: {
      ...lessonData.contenidos,

      vocabulario: {
        ...lessonData.contenidos?.vocabulario,

        palabras: vocabularyItems.map((item) => ({
          termino: item.term || item.termino || item.palabra || "",
          palabra: item.term || item.termino || item.palabra || "",
          traduccion:
            item.translation ||
            item.traduccion ||
            item.definition ||
            item.definicion ||
            "",
          definicion:
            item.definition ||
            item.definicion ||
            item.translation ||
            item.traduccion ||
            "",
          ejemplo: item.example || item.ejemplo || "",
          audioSrc: item.audioSrc || ""
        })),

        items: vocabularyItems
      },

      gramatica: {
        ...lessonData.contenidos?.gramatica,
            
        temas:
          lessonData.contenidos?.gramatica?.temas || [],
            
        reglas:
          lessonData.contenidos?.gramatica?.reglas || [],
            
        ejemplos: grammarExamples
      }
    },

    practica_interactiva: {
      titulo:
        lessonData.practica_interactiva?.titulo ||
        lessonData.practica_interactiva?.title ||
        "Práctica interactiva",
      descripcion:
        lessonData.practica_interactiva?.descripcion ||
        lessonData.practica_interactiva?.description ||
        "",
      ejercicios: normalizedPracticeExercises
    },

    actividades:
      lessonData.actividades?.length > 0
        ? lessonData.actividades
        : normalizedPracticeExercises,

    activities:
      lessonData.activities?.length > 0
        ? lessonData.activities
        : normalizedPracticeExercises
  };
};

const normalizeExerciseForApp = (exercise = {}) => {
  const type = (exercise.tipo || exercise.type || "").toLowerCase();

  switch (type) {
    case "multiple_choice":
    case "seleccion_multiple":
      return {
        tipo: "seleccion_multiple",
        pregunta: exercise.pregunta || exercise.question || "",
        opciones: exercise.opciones || exercise.options || [],
        respuesta_correcta:
          exercise.respuesta_correcta ||
          exercise.answer ||
          exercise.correctAnswer ||
          ""
      };

    case "fill_blank":
    case "completar":
      return {
        tipo: "completar",
        pregunta: exercise.pregunta || exercise.question || "",
        instrucciones:
          exercise.instrucciones ||
          exercise.instructions ||
          "Completa los espacios en blanco.",
        texto:
          exercise.texto ||
          exercise.text ||
          convertQuestionToBlankText(exercise.question || ""),
        palabras: exercise.palabras || exercise.words || [],
        respuestas:
          exercise.respuestas ||
          exercise.answers ||
          buildBlankAnswers(exercise)
      };

    case "matching":
    case "relacionar":
      return {
        tipo: "relacionar",
        instrucciones:
          exercise.instrucciones ||
          exercise.instructions ||
          "Relaciona cada elemento con su respuesta correcta.",
        pares_izquierda:
          exercise.pares_izquierda ||
          exercise.leftItems ||
          exercise.left ||
          [],
        pares_derecha:
          exercise.pares_derecha ||
          exercise.rightItems ||
          exercise.right ||
          [],
        respuestas_correctas:
          exercise.respuestas_correctas ||
          exercise.correctPairs ||
          {}
      };

    case "ordering":
    case "ordenar":
      return {
        tipo: "ordenar",
        instrucciones:
          exercise.instrucciones ||
          exercise.instructions ||
          "Ordena los elementos correctamente.",
        elementos: exercise.elementos || exercise.items || [],
        orden_correcto:
          exercise.orden_correcto ||
          exercise.correctOrder ||
          []
      };

    default:
      return {
        tipo: "seleccion_multiple",
        pregunta: exercise.pregunta || exercise.question || "Pregunta",
        opciones: exercise.opciones || exercise.options || [],
        respuesta_correcta:
          exercise.respuesta_correcta ||
          exercise.answer ||
          exercise.correctAnswer ||
          ""
      };
  }
};

const convertQuestionToBlankText = (question = "") => {
  if (!question) return "__";

  return question.includes("____")
    ? question.replace("____", "__")
    : `${question} __`;
};

const buildBlankAnswers = (exercise = {}) => {
  const answer =
    exercise.answer ||
    exercise.respuesta_correcta ||
    exercise.correctAnswer ||
    "";

  return answer ? { blank0: answer } : {};
};

export default AIGeneratedLessonsReview;