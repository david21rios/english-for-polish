// src/components/admin/AILessonGenerator.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMagic,
  FaSave,
  FaSpinner
} from "react-icons/fa";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db, auth } from "../../firebase";
import { generateLessonWithAgents } from "../../services/ai/lessonAgentsService";
import {
  getNextLessonNumber,
  getNextLessonOrderInModule
} from "../../services/lessonManager";
import { getModulesByLevel } from "../../services/moduleService";

const LEVEL_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const AGE_GROUP_OPTIONS = [
  { value: "all", label: "Wszyscy użytkownicy" },
  { value: "kids_early", label: "Dzieci 5–7" },
  { value: "kids", label: "Dzieci 8–12" },
  { value: "teens", label: "Młodzież 13–17" },
  { value: "adults", label: "Dorośli 18+" }
];

const TARGET_LANGUAGE = "English";
const SUPPORT_LANGUAGE = "Polish";

const sanitizeForFirestore = (value, insideArray = false) => {
  if (Array.isArray(value)) {
    if (insideArray) {
      return value.map((item, index) => ({
        index,
        value: sanitizeForFirestore(item, false)
      }));
    }

    return value.map((item) => sanitizeForFirestore(item, true));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, item]) => {
      acc[key] = sanitizeForFirestore(item, false);
      return acc;
    }, {});
  }

  return value;
};

const AILessonGenerator = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    lessonId: "A1_1",
    lessonNumber: 1,
    orderInModule: 1,
    lessonTopic: "Greetings and introductions",
    levelId: "A1",
    moduleId: "",
    ageGroup: "all"
  });

  const [modules, setModules] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState(null);
  const [executionLog, setExecutionLog] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedModule = modules.find(
    (module) => (module.moduleId || module.id) === formData.moduleId
  );

  const loadModulesAndLessonId = async (levelId) => {
    try {
      const levelModules = await getModulesByLevel(levelId, {
        includeDrafts: true
      });

      const firstModuleId =
        levelModules[0]?.moduleId || levelModules[0]?.id || "";

      const moduleId = formData.moduleId || firstModuleId;

      const nextNumber = await getNextLessonNumber(levelId);
      const nextOrder = moduleId
        ? await getNextLessonOrderInModule(levelId, moduleId)
        : 1;

      setModules(levelModules);

      setFormData((prev) => ({
        ...prev,
        levelId,
        moduleId,
        lessonNumber: nextNumber,
        lessonId: `${levelId}_${nextNumber}`,
        orderInModule: nextOrder
      }));
    } catch (err) {
      console.error("Error loading modules or next lesson ID:", err);
      setError("Nie można załadować modułów lub numeru lekcji.");
    }
  };

  useEffect(() => {
    loadModulesAndLessonId(formData.levelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = async (event) => {
    const { name, value } = event.target;

    setError("");
    setSuccessMessage("");

    if (name === "levelId") {
      setGeneratedLesson(null);
      await loadModulesAndLessonId(value);
      return;
    }

    if (name === "moduleId") {
      const nextOrder = await getNextLessonOrderInModule(
        formData.levelId,
        value
      );

      setFormData((prev) => ({
        ...prev,
        moduleId: value,
        orderInModule: nextOrder
      }));

      setGeneratedLesson(null);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "lessonNumber" ? Number(value) : value
    }));
  };

  const handleGenerateLesson = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");
    setGeneratedLesson(null);
    setExecutionLog([]);

    if (!formData.lessonId.trim()) {
      setError("Brakuje poprawnego ID lekcji.");
      return;
    }

    if (!formData.moduleId) {
      setError("Najpierw wybierz moduł dla tej lekcji.");
      return;
    }

    if (!formData.lessonTopic.trim()) {
      setError("Wpisz temat lekcji.");
      return;
    }

    try {
      setGenerating(true);

      const result = await generateLessonWithAgents({
        lessonId: formData.lessonId.trim(),
        lessonTopic: formData.lessonTopic.trim(),
        lessonNumber: formData.lessonNumber,
        levelId: formData.levelId,
        moduleId: formData.moduleId,
        moduleTitle: selectedModule?.title || "",
        orderInModule: formData.orderInModule,
        targetLanguage: TARGET_LANGUAGE,
        baseLanguage: SUPPORT_LANGUAGE,
        supportLanguage: SUPPORT_LANGUAGE,
        ageGroup: formData.ageGroup
      });

      setExecutionLog(result.executionLog || []);

      if (!result.success) {
        setError(
          result.errors?.join(", ") ||
            result.error ||
            "Nie udało się wygenerować lekcji."
        );
        return;
      }

      const lessonData = result.lesson?.lessonData || {};

      const normalizedGeneratedLesson = {
        ...result.lesson,
        lessonData: {
          ...lessonData,
          id: formData.lessonId.trim(),
          lessonId: formData.lessonId.trim(),
          nivel: formData.levelId,
          level: formData.levelId,
          moduleId: formData.moduleId,
          moduleTitle: selectedModule?.title || "",
          orderInModule: formData.orderInModule,
          ageGroup: formData.ageGroup,
          status: "draft"
        },
        metadata: {
          ...(result.lesson?.metadata || {}),
          status: "pending_review",
          levelId: formData.levelId,
          moduleId: formData.moduleId,
          moduleTitle: selectedModule?.title || "",
          lessonId: formData.lessonId.trim(),
          lessonNumber: formData.lessonNumber,
          orderInModule: formData.orderInModule,
          targetLanguage: TARGET_LANGUAGE,
          baseLanguage: SUPPORT_LANGUAGE,
          supportLanguage: SUPPORT_LANGUAGE,
          product: "Polish-learning"
        }
      };

      setGeneratedLesson(normalizedGeneratedLesson);
      setSuccessMessage(
        "Lekcja została wygenerowana. Sprawdź ją przed zapisaniem."
      );
    } catch (err) {
      console.error("AI lesson generation error:", err);
      setError("Wystąpił błąd podczas generowania lekcji.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePendingLesson = async () => {
    if (!generatedLesson) {
      setError("Brak wygenerowanej lekcji do zapisania.");
      return;
    }

    if (!formData.moduleId) {
      setError("Lekcja musi mieć przypisany moduł.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const currentUser = auth.currentUser;

      const safeGeneratedLesson = sanitizeForFirestore(generatedLesson);

      await addDoc(collection(db, "aiGeneratedLessons"), {
        ...safeGeneratedLesson,
        status: "pending_review",
        metadata: {
          ...(safeGeneratedLesson.metadata || {}),
          status: "pending_review"
        },
        createdBy: currentUser?.uid || null,
        createdByEmail: currentUser?.email || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSuccessMessage("Lekcja została zapisana jako oczekująca na przegląd.");
      setGeneratedLesson(null);
      setExecutionLog([]);

      await loadModulesAndLessonId(formData.levelId);
    } catch (err) {
      console.error("Error saving generated lesson:", err);
      setError("Nie można zapisać wygenerowanej lekcji.");
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
        Wróć do panelu lekcji
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
            Generator lekcji AI
          </h2>

          <p className="text-gray-600 mt-2 max-w-3xl">
            Ten moduł generuje lekcje języka angielskiego dla polskich
            studentów. Lekcja zostanie przypisana do konkretnego poziomu CEFR i
            modułu akademickiego.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleGenerateLesson}
        className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Poziom CEFR
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
            Moduł
          </label>

          <select
            name="moduleId"
            value={formData.moduleId}
            onChange={handleChange}
            disabled={modules.length === 0}
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
          >
            {modules.length === 0 ? (
              <option value="">Brak modułów dla tego poziomu</option>
            ) : (
              modules.map((module) => {
                const moduleId = module.moduleId || module.id;

                return (
                  <option key={moduleId} value={moduleId}>
                    {module.icon || "📚"} {module.title}
                  </option>
                );
              })
            )}
          </select>

          {modules.length === 0 && (
            <p className="text-xs text-red-600 mt-2">
              Najpierw utwórz moduł w panelu administratora.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Grupa wiekowa
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

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ID lekcji
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
            Numer lekcji
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
            Kolejność w module
          </label>

          <input
            type="number"
            name="orderInModule"
            min="1"
            value={formData.orderInModule}
            readOnly
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>

        <div className="md:col-span-2 xl:col-span-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Temat lekcji
          </label>

          <input
            type="text"
            name="lessonTopic"
            value={formData.lessonTopic}
            onChange={handleChange}
            placeholder="Np. Greetings and introductions"
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="md:col-span-2 xl:col-span-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-sm text-blue-800">
            <strong>Język docelowy:</strong> English ·{" "}
            <strong>Język wsparcia:</strong> Polish
          </p>
        </div>

        <div className="md:col-span-2 xl:col-span-3 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={generating || modules.length === 0}
            className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <FaSpinner className="animate-spin" />
                Generowanie...
              </>
            ) : (
              <>
                <FaMagic />
                Wygeneruj lekcję AI
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
                Zapisywanie...
              </>
            ) : (
              <>
                <FaSave />
                Zapisz do przeglądu
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
          <h3 className="font-bold text-gray-900 mb-4">Log agentów</h3>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
            {executionLog.map((item, index) => (
              <div
                key={`${item.agent}-${index}`}
                className="bg-white border border-gray-100 rounded-xl p-3 text-sm"
              >
                <p className="font-semibold text-gray-900">{item.agent}</p>
                <p className="text-green-600">{item.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {generatedLesson && lessonData && (
        <div className="space-y-6">
          <div className="bg-primary-50 border border-primary-100 rounded-3xl p-6">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
              Podgląd
            </p>

            <h3 className="text-3xl font-bold text-gray-900 mt-2">
              {lessonData.titulo || "Untitled lesson"}
            </h3>

            <p className="text-gray-700 mt-3">
              {lessonData.descripcion || "Brak opisu."}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                Poziom {lessonData.level || lessonData.nivel}
              </span>

              <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                Moduł: {lessonData.moduleTitle || formData.moduleId}
              </span>

              <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                English → Polish support
              </span>

              <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                {lessonData.ageGroup}
              </span>
            </div>
          </div>

          <PreviewCard title="JSON wygenerowany">
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
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      <div className="text-gray-700">{children}</div>
    </div>
  );
};

export default AILessonGenerator;