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

      setLessons(
        snapshot.docs.map((item) => ({
          docId: item.id,
          ...item.data()
        }))
      );
    } catch (err) {
      console.error("Error loading AI generated lessons:", err);
      setError("Nie można załadować lekcji wygenerowanych przez AI.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGeneratedLessons();
  }, []);

  const visibleLessons = lessons.filter((lesson) => {
    const rootStatus = lesson.status || "";
    const metadataStatus = lesson.metadata?.status || "";

    return rootStatus === "pending_review" || metadataStatus === "pending_review";
  });

  const handleReject = async (lesson) => {
    const title = lesson.lessonData?.titulo || lesson.docId;

    const confirmReject = window.confirm(
      `Czy na pewno chcesz odrzucić lekcję "${title}"?`
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

      setSuccessMessage("Lekcja została odrzucona.");
      setSelectedLesson(null);
      await loadGeneratedLessons();
    } catch (err) {
      console.error("Error rejecting AI lesson:", err);
      setError("Nie można odrzucić lekcji.");
    } finally {
      setProcessingId("");
    }
  };

  const handlePublish = async (lesson) => {
    const lessonData = lesson.lessonData || {};
    const metadata = lesson.metadata || {};

    const levelId = lessonData.level || lessonData.nivel || metadata.levelId;
    const moduleId = lessonData.moduleId || metadata.moduleId;
    const lessonId = lessonData.id || lessonData.lessonId || metadata.lessonId;

    if (!levelId || !moduleId || !lessonId) {
      setError(
        "Lekcja AI musi mieć levelId, moduleId oraz lessonId przed publikacją."
      );
      return;
    }

    const confirmPublish = window.confirm(
      `Opublikować lekcję "${lessonData.titulo || lessonId}" w module ${
        lessonData.moduleTitle || moduleId
      }?`
    );

    if (!confirmPublish) return;

    try {
      setProcessingId(lesson.docId);
      setError("");
      setSuccessMessage("");

      const normalizedLessonData = normalizeAIGeneratedLessonForApp({
        ...lessonData,
        id: lessonId,
        lessonId,
        nivel: levelId,
        level: levelId,
        moduleId,
        moduleTitle: lessonData.moduleTitle || metadata.moduleTitle || "",
        orderInModule:
          Number(lessonData.orderInModule || metadata.orderInModule) || 1
      });

      const cleanedLesson = cleanLessonData({
        ...normalizedLessonData,
        id: lessonId,
        lessonId,
        nivel: levelId,
        level: levelId,
        moduleId,
        moduleTitle: normalizedLessonData.moduleTitle || "",
        status: "draft",
        generatedByAI: true,
        approvedByTeacher: true,
        approvedAt: new Date().toISOString()
      });

      const lessonPayload = {
        ...cleanedLesson,
        id: lessonId,
        lessonId,
        nivel: levelId,
        level: levelId,
        moduleId,
        moduleTitle: cleanedLesson.moduleTitle || "",
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      await setDoc(
        doc(db, "levels", levelId, "modules", moduleId, "lessons", lessonId),
        lessonPayload,
        { merge: true }
      );

      await setDoc(
        doc(db, "levels", levelId, "lessons", lessonId),
        lessonPayload,
        { merge: true }
      );

      await updateDoc(doc(db, "aiGeneratedLessons", lesson.docId), {
        status: "published",
        "metadata.status": "published",
        "metadata.publishedPath": `levels/${levelId}/modules/${moduleId}/lessons/${lessonId}`,
        approvedBy: auth.currentUser?.uid || null,
        approvedByEmail: auth.currentUser?.email || null,
        approvedAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSuccessMessage(
        "Lekcja została opublikowana jako szkic w wybranym module."
      );

      setSelectedLesson(null);
      await loadGeneratedLessons();
      onPublished?.();
    } catch (err) {
      console.error("Error publishing AI lesson:", err);
      setError("Nie można opublikować lekcji wygenerowanej przez AI.");
    } finally {
      setProcessingId("");
    }
  };

  if (loading) {
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 text-gray-600">
          <FaSpinner className="animate-spin" />
          Ładowanie lekcji wygenerowanych przez AI...
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Lekcje AI oczekujące na przegląd
          </h2>

          <p className="text-sm text-gray-600 mt-1">
            Sprawdź, odrzuć albo opublikuj lekcje wygenerowane przez agentów AI.
          </p>
        </div>

        <button
          type="button"
          onClick={loadGeneratedLessons}
          className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-semibold"
        >
          Odśwież
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
          Brak lekcji AI oczekujących na przegląd.
        </div>
      ) : (
        <div className="space-y-4">
          {visibleLessons.map((lesson) => {
            const lessonData = lesson.lessonData || {};
            const metadata = lesson.metadata || {};
            const isProcessing = processingId === lesson.docId;

            return (
              <article
                key={lesson.docId}
                className="border border-gray-100 rounded-2xl p-4 bg-gray-50"
              >
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {lessonData.titulo || "Untitled lesson"}
                    </h3>

                    <p className="text-sm text-gray-600 mt-1">
                      ID: {lessonData.id || lessonData.lessonId} · Poziom:{" "}
                      {lessonData.level || lessonData.nivel || metadata.levelId} ·
                      Moduł:{" "}
                      {lessonData.moduleTitle ||
                        metadata.moduleTitle ||
                        lessonData.moduleId ||
                        metadata.moduleId ||
                        "N/A"}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      Target: {metadata.targetLanguage || "English"} · Support:{" "}
                      {metadata.supportLanguage || metadata.baseLanguage || "Polish"}
                    </p>

                    <p className="text-sm text-gray-700 mt-2">
                      {lessonData.descripcion || "Brak opisu."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLesson(
                          selectedLesson?.docId === lesson.docId ? null : lesson
                        );
                        setShowTechnicalJson(false);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-sm font-semibold"
                    >
                      <FaEye />
                      Podgląd
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
                      Opublikuj
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReject(lesson)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm font-semibold disabled:opacity-50"
                    >
                      <FaTimesCircle />
                      Odrzuć
                    </button>
                  </div>
                </div>

                {selectedLesson?.docId === lesson.docId && (
                  <GeneratedLessonPreview
                    lesson={lesson}
                    showTechnicalJson={showTechnicalJson}
                    onToggleJson={() => setShowTechnicalJson((prev) => !prev)}
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
  const metadata = lesson.metadata || {};
  const auditReport = lesson.auditReport || {};

  return (
    <div className="mt-5 bg-white border border-gray-100 rounded-2xl p-5 space-y-5">
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5">
        <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
          Podgląd lekcji
        </p>

        <h3 className="text-2xl font-bold text-gray-900 mt-2">
          {lessonData.titulo || "Untitled lesson"}
        </h3>

        <p className="text-gray-700 mt-2">
          {lessonData.descripcion || "Brak opisu."}
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
            Poziom {lessonData.level || lessonData.nivel || metadata.levelId}
          </span>

          <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
            Moduł:{" "}
            {lessonData.moduleTitle ||
              metadata.moduleTitle ||
              lessonData.moduleId ||
              metadata.moduleId ||
              "N/A"}
          </span>

          <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
            {metadata.targetLanguage || "English"}
          </span>

          <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
            Support: {metadata.supportLanguage || metadata.baseLanguage || "Polish"}
          </span>
        </div>
      </div>

      <PreviewSection title="Cele lekcji">
        <ul className="list-disc pl-5 space-y-1">
          {(lessonData.objetivos || []).map((item, index) => (
            <li key={index}>{renderText(item)}</li>
          ))}
        </ul>
      </PreviewSection>

      <PreviewSection title="Czytanie">
        <h4 className="font-semibold text-gray-900">
          {lessonData.lectura?.titulo || "Reading"}
        </h4>

        <p className="text-gray-700 mt-2 whitespace-pre-wrap">
          {lessonData.lectura?.contenido || "Brak tekstu czytania."}
        </p>

        {(lessonData.lectura?.preguntas || []).length > 0 && (
          <div className="mt-4 space-y-2">
            {(lessonData.lectura?.preguntas || []).map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 border border-gray-100 rounded-xl p-3"
              >
                <p className="font-medium text-gray-900">
                  {item.pregunta || item.question || "Question"}
                </p>

                {(item.opciones || item.options || []).length > 0 && (
                  <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
                    {(item.opciones || item.options || []).map((option, i) => (
                      <li key={i}>{option}</li>
                    ))}
                  </ul>
                )}

                <p className="text-sm text-green-700 mt-2">
                  Answer:{" "}
                  {item.respuesta_correcta ||
                    item.respuesta ||
                    item.answer ||
                    item.correctAnswer ||
                    "N/A"}
                </p>
              </div>
            ))}
          </div>
        )}
      </PreviewSection>

      <PreviewExercises
        title="Ćwiczenia interaktywne"
        block={lessonData.practica_interactiva}
      />

      <PreviewExercises title="Pisanie" block={lessonData.produccion_escrita} />

      <PreviewExercises title="Mówienie" block={lessonData.produccion_oral} />

      <PreviewEvaluation evaluation={lessonData.evaluacion} />

      <PreviewSection title="Podsumowanie">
        <p className="text-gray-700">
          {lessonData.reflexion_final || "Brak podsumowania."}
        </p>
      </PreviewSection>

      <PreviewSection title="Audyt AI">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <AuditBadge label="CEFR" value={auditReport.cefrAlignment} />
          <AuditBadge label="Language" value={auditReport.languageAccuracy} />
          <AuditBadge
            label="Localization"
            value={auditReport.culturalLocalization}
          />
          <AuditBadge label="JSON" value={auditReport.jsonValidation} />
        </div>
      </PreviewSection>

      <div>
        <button
          type="button"
          onClick={onToggleJson}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-semibold"
        >
          {showTechnicalJson ? <FaChevronUp /> : <FaChevronDown />}
          {showTechnicalJson ? "Ukryj JSON techniczny" : "Pokaż JSON techniczny"}
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

const PreviewSection = ({ title, children }) => (
  <section className="border border-gray-100 rounded-2xl p-4">
    <h4 className="font-bold text-gray-900 mb-3">{title}</h4>
    <div className="text-gray-700">{children}</div>
  </section>
);

const PreviewExercises = ({ title, block }) => {
  if (!block) return null;

  return (
    <PreviewSection title={title}>
      <p className="text-gray-600 mb-3">
        {block.descripcion || block.description || "Brak opisu."}
      </p>

      <div className="space-y-3">
        {(block.ejercicios || []).map((item, index) => (
          <div
            key={index}
            className="bg-gray-50 border border-gray-100 rounded-xl p-3"
          >
            <p className="font-medium text-gray-900">
              {item.pregunta ||
                item.question ||
                item.prompt ||
                item.instrucciones ||
                item.instructions ||
                "Exercise"}
            </p>

            {(item.opciones || item.options || []).length > 0 && (
              <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
                {(item.opciones || item.options || []).map((option, optionIndex) => (
                  <li key={optionIndex}>{option}</li>
                ))}
              </ul>
            )}

            {(item.elementos || item.items || []).length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Items: {(item.elementos || item.items || []).join(", ")}
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
    <PreviewSection title="Ocena">
      <p className="text-gray-700 mb-3">
        {evaluation.autoevaluacion || "Brak samooceny."}
      </p>

      <div className="space-y-3">
        {(evaluation.cuestionario || []).map((item, index) => (
          <div
            key={index}
            className="bg-gray-50 border border-gray-100 rounded-xl p-3"
          >
            <p className="font-medium text-gray-900">
              {item.pregunta || item.question || "Question"}
            </p>

            {(item.opciones || item.options || []).length > 0 && (
              <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
                {(item.opciones || item.options || []).map((option, optionIndex) => (
                  <li key={optionIndex}>{option}</li>
                ))}
              </ul>
            )}

            <p className="text-sm text-green-700 mt-2">
              Answer:{" "}
              {item.respuesta_correcta ||
                item.respuesta ||
                item.answer ||
                item.correctAnswer ||
                "N/A"}
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

const renderText = (value) => {
  if (typeof value === "string" || typeof value === "number") return value;

  if (value && typeof value === "object") {
    return (
      value.text ||
      value.titulo ||
      value.title ||
      value.pregunta ||
      value.question ||
      JSON.stringify(value)
    );
  }

  return "";
};

const normalizeAIGeneratedLessonForApp = (lessonData = {}) => {
  const vocabularyItems =
    lessonData.contenidos?.vocabulario?.items ||
    lessonData.contenidos?.vocabulario?.palabras ||
    [];

  const practiceExercises =
    lessonData.practica_interactiva?.ejercicios || [];

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
        temas: lessonData.contenidos?.gramatica?.temas || [],
        reglas: lessonData.contenidos?.gramatica?.reglas || []
      }
    },

    lectura: {
      titulo: lessonData.lectura?.titulo || "",
      autor: lessonData.lectura?.autor || "Polish Learning AI",
      contenido: lessonData.lectura?.contenido || "",
      preguntas: (lessonData.lectura?.preguntas || []).map(normalizeQuestion)
    },

    practica_interactiva: {
      titulo:
        lessonData.practica_interactiva?.titulo ||
        lessonData.practica_interactiva?.title ||
        "Interactive practice",
      descripcion:
        lessonData.practica_interactiva?.descripcion ||
        lessonData.practica_interactiva?.description ||
        "",
      ejercicios: practiceExercises.map(normalizeExerciseForApp)
    },

    evaluacion: {
      autoevaluacion: lessonData.evaluacion?.autoevaluacion || "",
      cuestionario: (lessonData.evaluacion?.cuestionario || []).map(
        normalizeQuestion
      )
    }
  };
};

const normalizeQuestion = (question = {}) => ({
  tipo: question.tipo || question.type || "seleccion_multiple",
  pregunta: question.pregunta || question.question || "",
  opciones: question.opciones || question.options || [],
  respuesta_correcta:
    question.respuesta_correcta ||
    question.respuesta ||
    question.answer ||
    question.correctAnswer ||
    "",
  respuestas_aceptadas: question.respuestas_aceptadas || []
});

const normalizeExerciseForApp = (exercise = {}) => {
  const type = (exercise.tipo || exercise.type || "").toLowerCase();

  if (["multiple_choice", "seleccion_multiple"].includes(type)) {
    return normalizeQuestion(exercise);
  }

  if (["fill_blank", "completar"].includes(type)) {
    return {
      tipo: "completar",
      pregunta: exercise.pregunta || exercise.question || "",
      instrucciones:
        exercise.instrucciones ||
        exercise.instructions ||
        "Complete the blanks.",
      texto:
        exercise.texto ||
        exercise.text ||
        convertQuestionToBlankText(exercise.question || ""),
      palabras: exercise.palabras || exercise.words || [],
      respuestas:
        exercise.respuestas || exercise.answers || buildBlankAnswers(exercise)
    };
  }

  if (["matching", "relacionar"].includes(type)) {
    return {
      tipo: "relacionar",
      instrucciones:
        exercise.instrucciones ||
        exercise.instructions ||
        "Match each item with the correct answer.",
      pares_izquierda:
        exercise.pares_izquierda || exercise.leftItems || exercise.left || [],
      pares_derecha:
        exercise.pares_derecha || exercise.rightItems || exercise.right || [],
      respuestas_correctas:
        exercise.respuestas_correctas || exercise.correctPairs || {}
    };
  }

  if (["ordering", "ordenar"].includes(type)) {
    return {
      tipo: "ordenar",
      instrucciones:
        exercise.instrucciones ||
        exercise.instructions ||
        "Put the items in the correct order.",
      elementos: exercise.elementos || exercise.items || [],
      orden_correcto:
        exercise.orden_correcto || exercise.correctOrder || []
    };
  }

  return normalizeQuestion(exercise);
};

const convertQuestionToBlankText = (question = "") =>
  question.includes("____") ? question.replace("____", "__") : `${question} __`;

const buildBlankAnswers = (exercise = {}) => {
  const answer =
    exercise.answer ||
    exercise.respuesta_correcta ||
    exercise.correctAnswer ||
    "";

  return answer ? { blank0: answer } : {};
};

export default AIGeneratedLessonsReview;