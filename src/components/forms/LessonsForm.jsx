// src/components/forms/LessonsForm.jsx

import React, { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";

import { tabs } from "./components/utils/constants";
import TabNavigation from "./components/TabNavigation";
import TabContent from "./components/TabContent";
import useFormData from "./components/hooks/useFormData";
import useFormValidation from "./components/hooks/useFormalValidation.js";

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
      setLocalFormData((prev) => ({
        ...prev,
        ...initialData,
        id: initialData.id || initialData.lessonId || prev.id || "",
        lessonId: initialData.lessonId || initialData.id || prev.lessonId || "",
        nivel: initialData.nivel || initialData.level || activeLevel,
        level: initialData.level || initialData.nivel || activeLevel,
        moduleId: initialData.moduleId || prev.moduleId || "",
        orderInModule: Number(initialData.orderInModule) || prev.orderInModule || 1
      }));
    }
  }, [initialData, activeLevel, setLocalFormData]);

  useEffect(() => {
    if (localFormData.id) {
      validateField("id", localFormData.id);
    }

    if (localFormData.titulo) {
      validateField("titulo", localFormData.titulo);
    }
  }, [localFormData.id, localFormData.titulo, validateField]);

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
    const moduleId = event.target.value;

    setLocalFormData((prev) => ({
      ...prev,
      moduleId
    }));

    setLocalError("");
  };

  const handleOrderChange = (event) => {
    const orderInModule = Number(event.target.value) || 1;

    setLocalFormData((prev) => ({
      ...prev,
      orderInModule
    }));
  };

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      setFieldTouched("id", true);
      setFieldTouched("titulo", true);

      if (!localFormData.moduleId) {
        setLocalError("Debes seleccionar un módulo para esta lección.");
        return;
      }

      if (Number(localFormData.orderInModule || 0) < 1) {
        setLocalError("El orden dentro del módulo debe ser mayor que cero.");
        return;
      }

      if (validateAllFields()) {
        setLocalError("");

        onSubmit({
          ...localFormData,
          nivel: localFormData.nivel || activeLevel,
          level: localFormData.level || activeLevel,
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
    if (isDirty) {
      window.onbeforeunload = () => true;
    } else {
      window.onbeforeunload = undefined;
    }

    return () => {
      window.onbeforeunload = undefined;
    };
  }, [isDirty]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (
        window.confirm(
          "¿Estás seguro de que quieres cancelar? Hay cambios sin guardar."
        )
      ) {
        onCancel();
      }
    } else {
      onCancel();
    }
  }, [isDirty, onCancel]);

  const areBasicFieldsComplete =
    localFormData.id?.trim() &&
    localFormData.titulo?.trim() &&
    localFormData.moduleId;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          Ubicación académica
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nivel
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
              Módulo
            </label>

            <select
              value={localFormData.moduleId || ""}
              onChange={handleModuleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecciona un módulo...</option>

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
              Orden en el módulo
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
            No hay módulos creados para este nivel. Crea un módulo antes de
            crear lecciones.
          </p>
        )}

        {localError && (
          <p className="text-sm text-red-600 mt-3">
            {localError}
          </p>
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
          Cancelar
        </button>

        {isDirty && (
          <button
            type="button"
            onClick={saveDraft}
            className="px-4 py-2 border border-blue-300 text-blue-700 rounded-md shadow-sm text-sm font-medium hover:bg-blue-50"
          >
            Guardar borrador
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
          {isEditing ? "Guardar cambios" : "Crear lección"}
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