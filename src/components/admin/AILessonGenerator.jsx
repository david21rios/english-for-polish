// src/components/admin/AILessonGenerator.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMagic,
  FaSpinner,
  FaSave,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowLeft
} from "react-icons/fa";
import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";

import { db, auth } from "../../firebase";
import { generateLessonWithAgents } from "../../services/ai/lessonAgentsService";
import { getNextLessonNumber } from "../../services/lessonManager";

const LEVEL_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const AGE_GROUP_OPTIONS = [
  { value: "all", label: "Todos los usuarios" },
  { value: "kids_early", label: "Niños 5–7" },
  { value: "kids", label: "Niños 8–12" },
  { value: "teens", label: "Jóvenes 13–17" },
  { value: "adults", label: "Adultos 18+" }
];

const AILessonGenerator = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    lessonId: "A1_1",
    lessonNumber: 1,
    lessonTopic: "Greetings and introductions",
    levelId: "A1",
    targetLanguage: "Spanish",
    baseLanguage: "English",
    ageGroup: "all"
  });

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState(null);
  const [executionLog, setExecutionLog] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = async (event) => {
    const { name, value } = event.target;
    
    if (name === "levelId") {
      await loadNextLessonId(value);
      return;
    }
  
    setFormData((prev) => ({
      ...prev,
      [name]: name === "lessonNumber" ? Number(value) : value
    }));
  };

  const loadNextLessonId = async (level) => {
    try {
      const nextNumber = await getNextLessonNumber(level);

      setFormData((prev) => ({
        ...prev,
        levelId: level,
        lessonNumber: nextNumber,
        lessonId: `${level}_${nextNumber}`
      }));
    } catch (error) {
      console.error("Error loading next lesson number:", error);
    }
  };

  useEffect(() => {
    loadNextLessonId(formData.levelId);
  }, []);

  const handleGenerateLesson = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");
    setGeneratedLesson(null);
    setExecutionLog([]);

    if (!formData.lessonId.trim()) {
      setError("Debes escribir un ID válido para la lección.");
      return;
    }

    if (!formData.lessonTopic.trim()) {
      setError("Debes escribir un tema para la lección.");
      return;
    }

    try {
      setGenerating(true);

      const result = await generateLessonWithAgents({
        lessonId: formData.lessonId.trim(),
        lessonTopic: formData.lessonTopic.trim(),
        lessonNumber: formData.lessonNumber,
        levelId: formData.levelId,
        targetLanguage: formData.targetLanguage.trim(),
        baseLanguage: formData.baseLanguage.trim(),
        ageGroup: formData.ageGroup
      });

      setExecutionLog(result.executionLog || []);

      if (!result.success) {
        setError(
          result.errors?.join(", ") ||
            result.error ||
            "No se pudo generar la lección."
        );
        return;
      }

      setGeneratedLesson(result.lesson);
      setSuccessMessage(
        "Lección generada correctamente. Revísala antes de guardarla."
      );
    } catch (err) {
      console.error("AI lesson generation error:", err);
      setError("Ocurrió un error generando la lección.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePendingLesson = async () => {
    if (!generatedLesson) {
      setError("No hay una lección generada para guardar.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const currentUser = auth.currentUser;

      await addDoc(collection(db, "aiGeneratedLessons"), {
        ...generatedLesson,
        status: "pending_review",
        createdBy: currentUser?.uid || null,
        createdByEmail: currentUser?.email || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSuccessMessage(
        "Lección guardada como pendiente de revisión."
      );
      setGeneratedLesson(null);
      setExecutionLog([]);
      await loadNextLessonId(formData.levelId);
    } catch (err) {
      console.error("Error saving generated lesson:", err);
      setError("No se pudo guardar la lección generada.");
    } finally {
      setSaving(false);
    }
  };

  const lessonData = generatedLesson?.lessonData;

  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium"
      >
        <FaArrowLeft />
        Volver al panel de lecciones
      </button>
      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-2xl shrink-0">
          <FaMagic />
        </div>
        
        <div>
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
            AI Lesson Generator
          </p>

          <h2 className="text-3xl font-bold text-gray-900">
            Generador de lecciones con agentes IA
          </h2>

          <p className="text-gray-600 mt-2 max-w-3xl">
            Este módulo genera una lección usando agentes en cascada:
            planificación curricular, investigación controlada, curaduría
            pedagógica, diseño instruccional, redacción, localización cultural y
            auditoría final.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleGenerateLesson}
        className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ID de lección
          </label>

          <input
            type="text"
            name="lessonId"
            value={formData.lessonId}
            readOnly
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Número de lección
          </label>

          <input
            type="number"
            name="lessonNumber"
            min="1"
            value={formData.lessonNumber}
            readOnly
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nivel CEFR
          </label>

          <select
            name="levelId"
            value={formData.levelId}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {LEVEL_OPTIONS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Idioma objetivo
          </label>

          <input
            type="text"
            name="targetLanguage"
            value={formData.targetLanguage}
            onChange={handleChange}
            placeholder="Ej: Spanish"
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Idioma base del estudiante
          </label>

          <input
            type="text"
            name="baseLanguage"
            value={formData.baseLanguage}
            onChange={handleChange}
            placeholder="Ej: Polish"
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Grupo de edad
          </label>

          <select
            name="ageGroup"
            value={formData.ageGroup}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {AGE_GROUP_OPTIONS.map((group) => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 xl:col-span-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tema de la lección
          </label>

          <input
            type="text"
            name="lessonTopic"
            value={formData.lessonTopic}
            onChange={handleChange}
            placeholder="Ej: Greetings and introductions"
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="md:col-span-2 xl:col-span-3 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <FaSpinner className="animate-spin" />
                Generando con agentes...
              </>
            ) : (
              <>
                <FaMagic />
                Generar lección con IA
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSavePendingLesson}
            disabled={!generatedLesson || saving}
            className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <FaSpinner className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <FaSave />
                Guardar pendiente
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 flex gap-3">
          <FaExclamationTriangle className="mt-1 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-100 text-green-700 rounded-2xl p-4 flex gap-3">
          <FaCheckCircle className="mt-1 shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {executionLog.length > 0 && (
        <div className="mb-8 bg-gray-50 border border-gray-100 rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">
            Ejecución de agentes
          </h3>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
            {executionLog.map((item, index) => (
              <div
                key={`${item.agent}-${index}`}
                className="bg-white border border-gray-100 rounded-xl p-3 text-sm"
              >
                <p className="font-semibold text-gray-900">
                  {item.agent}
                </p>

                <p className="text-green-600">
                  {item.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {generatedLesson && lessonData && (
        <div className="space-y-6">
          <div className="bg-primary-50 border border-primary-100 rounded-3xl p-6">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
              Vista previa
            </p>

            <h3 className="text-3xl font-bold text-gray-900 mt-2">
              {lessonData.titulo || "Sin título"}
            </h3>

            <p className="text-gray-700 mt-3">
              {lessonData.descripcion || "Sin descripción"}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                Nivel {lessonData.level}
              </span>

              <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                {generatedLesson.metadata?.targetLanguage}
              </span>

              <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                Base: {generatedLesson.metadata?.baseLanguage}
              </span>

              <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                {lessonData.ageGroup}
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <PreviewCard title="Objetivos">
              <ul className="list-disc pl-5 space-y-1">
                {(lessonData.objetivos || []).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </PreviewCard>

            <PreviewCard title="Vocabulario">
              <div className="space-y-3">
                {(lessonData.contenidos?.vocabulario?.palabras || []).map(
                  (item, index) => (
                    <div
                      key={index}
                      className="border border-gray-100 rounded-xl p-3"
                    >
                      <p className="font-semibold text-gray-900">
                        {item.palabra || item.termino}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.traduccion || item.definicion}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.ejemplo}
                      </p>
                    </div>
                  )
                )}
              </div>
            </PreviewCard>

            <PreviewCard title="Gramática">
              <p className="text-gray-700">
                {lessonData.contenidos?.gramatica?.explanation}
              </p>

              <div className="mt-4 space-y-3">
                {(lessonData.contenidos?.gramatica?.reglas || []).map((regla, index) => (
                  <div key={index} className="border border-gray-100 rounded-xl p-3">
                    <h4 className="font-semibold text-gray-900">
                      {regla.titulo}
                    </h4>
                                
                    <p className="text-gray-700 mt-2">
                      {regla.explicacion}
                    </p>
                                
                    <div className="mt-3 space-y-2">
                      {(regla.ejemplos || []).map((ejemplo, ejemploIndex) => (
                        <div
                          key={ejemploIndex}
                          className="bg-gray-50 rounded-lg p-3"
                        >
                          <p className="font-medium text-gray-900">
                            {ejemplo.frase}
                          </p>
                          <p className="text-sm text-gray-600">
                            {ejemplo.traduccion}
                          </p>
                          <p className="text-sm text-gray-500">
                            {ejemplo.nota}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PreviewCard>

            <PreviewCard title="Lectura">
              <h4 className="font-bold text-gray-900">
                {lessonData.lectura?.titulo}
              </h4>

              <p className="text-gray-700 mt-2 whitespace-pre-wrap">
                {lessonData.lectura?.contenido}
              </p>
            </PreviewCard>
          </div>

          <PreviewCard title="JSON generado">
            <pre className="bg-gray-900 text-gray-100 rounded-2xl p-4 overflow-auto text-xs max-h-[520px]">
              {JSON.stringify(generatedLesson, null, 2)}
            </pre>
          </PreviewCard>
        </div>
      )}
    </section>
  );
};

const PreviewCard = ({ title, children }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        {title}
      </h3>

      <div className="text-gray-700">
        {children}
      </div>
    </div>
  );
};

export default AILessonGenerator;