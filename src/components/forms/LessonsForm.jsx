// src/components/forms/LessonsForm.jsx

import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";

import { tabs } from "./components/utils/constants";
import TabNavigation from "./components/TabNavigation";
import TabContent from "./components/TabContent";
import useFormData from "./components/hooks/useFormData";
import useFormValidation from "./components/hooks/useFormalValidation.js";

const toArray = (value) => (Array.isArray(value) ? value : []);

const adaptWritingExercise = (exercise = {}) => ({
  ...exercise,
  instrucciones:
    exercise.instrucciones ||
    exercise.instructions ||
    exercise.prompt ||
    exercise.task ||
    "",
  extension_minima:
    exercise.extension_minima ??
    exercise.minimumWords ??
    exercise.minWords ??
    "",
  extension_maxima:
    exercise.extension_maxima ??
    exercise.maximumWords ??
    exercise.maxWords ??
    "",
  tiempo_sugerido:
    exercise.tiempo_sugerido ??
    exercise.suggestedTimeMinutes ??
    exercise.suggestedTime ??
    "",
  criterios:
    exercise.criterios ||
    exercise.criteria ||
    exercise.evaluationCriteria ||
    []
});

const adaptOralExercise = (exercise = {}) => ({
  ...exercise,
  consigna:
    exercise.consigna ||
    exercise.prompt ||
    exercise.task ||
    exercise.instructions ||
    "",
  guia:
    exercise.guia ||
    exercise.guide ||
    exercise.studentGuide ||
    exercise.hints ||
    "",
  tiempo_sugerido:
    exercise.tiempo_sugerido ||
    exercise.suggestedTime ||
    exercise.suggestedTimeMinutes ||
    "",
  criterios:
    exercise.criterios ||
    exercise.criteria ||
    exercise.selfAssessmentCriteria ||
    []
});

const adaptLessonToAdminForm = (lesson = {}, activeLevel = "A1") => {
  const lessonData = lesson.lessonData || {};

  const vocabulary =
    lesson.contenidos?.vocabulario ||
    lesson.contents?.vocabulary ||
    lessonData.vocabulary ||
    lessonData.contents?.vocabulary ||
    {};

  const grammar =
    lesson.contenidos?.gramatica ||
    lesson.contents?.grammar ||
    lessonData.grammar ||
    lessonData.contents?.grammar ||
    {};

  const reading =
    lesson.lectura ||
    lesson.reading ||
    lessonData.reading ||
    {};

  const interactivePractice =
    lesson.practica_interactiva ||
    lesson.interactivePractice ||
    lessonData.interactivePractice ||
    lessonData.practice ||
    {};

  const writing =
    lesson.produccion_escrita ||
    lesson.writingProduction ||
    lessonData.writing ||
    lessonData.writingProduction ||
    {};

  const speaking =
    lesson.produccion_oral ||
    lesson.oralProduction ||
    lessonData.speaking ||
    lessonData.oralProduction ||
    {};

  const evaluation =
    lesson.evaluacion ||
    lesson.evaluation ||
    lessonData.evaluation ||
    {};

  const resources =
    lesson.recursos_adicionales ||
    lesson.resources ||
    lesson.additionalResources ||
    lessonData.resources ||
    lessonData.additionalResources ||
    [];

  return {
    ...lesson,

    id: lesson.id || lesson.lessonId || "",
    lessonId: lesson.lessonId || lesson.id || "",

    level: lesson.level || lesson.nivel || activeLevel,
    nivel: lesson.nivel || lesson.level || activeLevel,

    titulo: lesson.titulo || lesson.title || lessonData.title || "",
    descripcion:
      lesson.descripcion || lesson.description || lessonData.description || "",

    objetivos:
      lesson.objetivos ||
      lesson.objectives ||
      lessonData.objectives ||
      [],

    contenidos: {
      vocabulario: {
        titulo:
          vocabulary.titulo ||
          vocabulary.title ||
          "Key Vocabulary",
        palabras:
          vocabulary.palabras ||
          vocabulary.words ||
          vocabulary.items ||
          []
      },
      gramatica: {
        temas:
          grammar.temas ||
          grammar.topics ||
          [],
        reglas:
          grammar.reglas ||
          grammar.rules ||
          []
      }
    },

    lectura: {
      titulo:
        reading.titulo ||
        reading.title ||
        "",
      autor:
        reading.autor ||
        reading.author ||
        "AI Tutor",
      contenido:
        reading.contenido ||
        reading.content ||
        reading.text ||
        "",
      preguntas:
        reading.preguntas ||
        reading.questions ||
        []
    },

    practica_interactiva: {
      titulo:
        interactivePractice.titulo ||
        interactivePractice.title ||
        "",
      descripcion:
        interactivePractice.descripcion ||
        interactivePractice.description ||
        "",
      ejercicios:
        interactivePractice.ejercicios ||
        interactivePractice.exercises ||
        []
    },

    produccion_escrita: {
      titulo:
        writing.titulo ||
        writing.title ||
        "",
      descripcion:
        writing.descripcion ||
        writing.description ||
        "",
      ejercicios: toArray(
        writing.ejercicios ||
        writing.exercises ||
        writing.activities
      ).map(adaptWritingExercise)
    },

    produccion_oral: {
      titulo:
        speaking.titulo ||
        speaking.title ||
        "",
      descripcion:
        speaking.descripcion ||
        speaking.description ||
        "",
      ejercicios: toArray(
        speaking.ejercicios ||
        speaking.exercises ||
        speaking.activities
      ).map(adaptOralExercise)
    },

    evaluacion: {
      autoevaluacion:
        evaluation.autoevaluacion ||
        evaluation.selfAssessment ||
        evaluation.self_assessment ||
        "",
      cuestionario:
        evaluation.cuestionario ||
        evaluation.questions ||
        evaluation.quiz ||
        [],
      criterios_evaluacion:
        evaluation.criterios_evaluacion ||
        evaluation.criteria ||
        evaluation.evaluationCriteria ||
        []
    },

    recursos_adicionales: resources,

    reflexion_final:
      lesson.reflexion_final ||
      lesson.finalReflection ||
      lesson.reflection ||
      lessonData.finalReflection ||
      lessonData.reflection ||
      ""
  };
};

const LessonForm = ({
  isEditing,
  initialData,
  activeLevel = "A1",
  modules = [],
  onSubmit,
  onCancel
}) => {
  const {
    formData: localFormData,
    setFormData: setLocalFormData,
    isDirty,
    saveDraft
  } = useFormData(initialData, isEditing);

  const {
    errors,
    validateAllFields,
    setFieldTouched,
    validateField
  } = useFormValidation(localFormData);

  const [activeTab, setActiveTab] = useState("basic");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (initialData) {
      const adaptedData = adaptLessonToAdminForm(initialData, activeLevel);

      setLocalFormData((prev) => ({
        ...prev,
        ...adaptedData,
        id: adaptedData.id || adaptedData.lessonId || prev.id || "",
        lessonId: adaptedData.lessonId || adaptedData.id || prev.lessonId || "",
        nivel: adaptedData.nivel || adaptedData.level || activeLevel,
        level: adaptedData.level || adaptedData.nivel || activeLevel,
        moduleId: adaptedData.moduleId || prev.moduleId || "",
        orderInModule:
          Number(adaptedData.orderInModule) || prev.orderInModule || 1
      }));
    }
  }, [initialData, activeLevel, setLocalFormData]);

  useEffect(() => {
    if (localFormData.id) {
      validateField("id", localFormData.id);
    }

    if (localFormData.titulo || localFormData.title) {
      validateField("titulo", localFormData.titulo || localFormData.title);
    }
  }, [
    localFormData.id,
    localFormData.titulo,
    localFormData.title,
    validateField
  ]);

  useEffect(() => {
    if (!localFormData.moduleId && modules.length > 0) {
      const firstModuleId = modules[0].moduleId || modules[0].id;

      setLocalFormData((prev) => ({
        ...prev,
        moduleId: firstModuleId
      }));
    }
  }, [modules, localFormData.moduleId, setLocalFormData]);

  const handleModuleChange = (event) => {
    setLocalFormData((prev) => ({
      ...prev,
      moduleId: event.target.value
    }));

    setLocalError("");
  };

  const handleOrderChange = (event) => {
    setLocalFormData((prev) => ({
      ...prev,
      orderInModule: Number(event.target.value) || 1
    }));
  };

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      setFieldTouched("id", true);
      setFieldTouched("titulo", true);

      if (!localFormData.moduleId) {
        setLocalError("Wybierz moduł dla tej lekcji.");
        return;
      }

      if (Number(localFormData.orderInModule || 0) < 1) {
        setLocalError("Kolejność w module musi być większa niż zero.");
        return;
      }

      if (validateAllFields()) {
        setLocalError("");

        const lessonTitle = localFormData.title || localFormData.titulo || "";
        const lessonDescription =
          localFormData.description || localFormData.descripcion || "";

        onSubmit({
          ...localFormData,
          level: localFormData.level || localFormData.nivel || activeLevel,
          nivel: localFormData.nivel || localFormData.level || activeLevel,
          title: lessonTitle,
          description: lessonDescription,
          titulo: localFormData.titulo || lessonTitle,
          descripcion: localFormData.descripcion || lessonDescription,
          moduleId: localFormData.moduleId,
          orderInModule: Number(localFormData.orderInModule) || 1
        });
      }
    },
    [
      activeLevel,
      localFormData,
      validateAllFields,
      setFieldTouched,
      onSubmit
    ]
  );

  useEffect(() => {
    window.onbeforeunload = isDirty ? () => true : undefined;

    return () => {
      window.onbeforeunload = undefined;
    };
  }, [isDirty]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmCancel = window.confirm(
        "Czy na pewno chcesz anulować? Masz niezapisane zmiany."
      );

      if (!confirmCancel) return;
    }

    onCancel();
  }, [isDirty, onCancel]);

  const areBasicFieldsComplete =
    localFormData.id?.trim() &&
    (localFormData.titulo?.trim() || localFormData.title?.trim()) &&
    localFormData.moduleId;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          Lokalizacja akademicka
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poziom
            </label>

            <input
              type="text"
              value={activeLevel}
              disabled
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-100 text-gray-700"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moduł
            </label>

            <select
              value={localFormData.moduleId || ""}
              onChange={handleModuleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Wybierz moduł...</option>

              {modules.map((module) => {
                const moduleId = module.moduleId || module.id;

                return (
                  <option key={moduleId} value={moduleId}>
                    {module.icon || "📚"} {module.title}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kolejność w module
            </label>

            <input
              type="number"
              min="1"
              value={localFormData.orderInModule || 1}
              onChange={handleOrderChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {modules.length === 0 && (
          <p className="text-sm text-red-600 mt-3">
            Brak modułów dla tego poziomu. Utwórz moduł przed dodaniem lekcji.
          </p>
        )}

        {localError && (
          <p className="text-sm text-red-600 mt-3">{localError}</p>
        )}
      </div>

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <TabContent
        activeTab={activeTab}
        formData={localFormData}
        setFormData={setLocalFormData}
        errors={errors}
        isEditing={isEditing}
        setFieldTouched={setFieldTouched}
      />

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Anuluj
        </button>

        {isDirty && (
          <button
            type="button"
            onClick={saveDraft}
            className="px-4 py-2 border border-blue-300 text-blue-700 rounded-md shadow-sm text-sm font-medium hover:bg-blue-50"
          >
            Zapisz szkic
          </button>
        )}

        <button
          type="submit"
          disabled={!areBasicFieldsComplete || modules.length === 0}
          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            areBasicFieldsComplete && modules.length > 0
              ? "bg-primary-600 hover:bg-primary-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {isEditing ? "Zapisz zmiany" : "Utwórz lekcję"}
        </button>
      </div>
    </form>
  );
};

LessonForm.propTypes = {
  isEditing: PropTypes.bool,
  initialData: PropTypes.object,
  activeLevel: PropTypes.string,
  modules: PropTypes.array,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

LessonForm.defaultProps = {
  isEditing: false,
  initialData: null,
  activeLevel: "A1",
  modules: []
};

export default LessonForm;