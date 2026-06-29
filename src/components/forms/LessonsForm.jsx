// components/forms/LessonsForm.jsx
import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { tabs } from './components/utils/constants';
import TabNavigation from './components/TabNavigation';
import TabContent from './components/TabContent';
import useFormData from './components/hooks/useFormData';
import useFormValidation from './components/hooks/useFormalValidation.js';

const LessonForm = ({ isEditing, initialData, onSubmit, onCancel }) => {
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

  const [activeTab, setActiveTab] = useState('basic');

  // Validar campos básicos cuando cambien
  useEffect(() => {
    if (localFormData.id) {
      validateField('id', localFormData.id);
    }
    if (localFormData.titulo) {
      validateField('titulo', localFormData.titulo);
    }
  }, [localFormData.id, localFormData.titulo, validateField]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    // Marcar campos básicos como tocados
    setFieldTouched('id', true);
    setFieldTouched('titulo', true);

    if (validateAllFields()) {
      onSubmit(localFormData);
    }
  }, [localFormData, validateAllFields, setFieldTouched, onSubmit]);

  // Advertencia al salir con cambios sin guardar
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
      if (window.confirm('¿Estás seguro de que quieres cancelar? Hay cambios sin guardar.')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  }, [isDirty, onCancel]);

  // Verificar si los campos básicos están completos
  const areBasicFieldsComplete = localFormData.id?.trim() && localFormData.titulo?.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          disabled={!areBasicFieldsComplete}
          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${areBasicFieldsComplete
              ? 'bg-primary-600 hover:bg-primary-700'
              : 'bg-gray-400 cursor-not-allowed'}`}
        >
          {isEditing ? 'Guardar cambios' : 'Crear lección'}
        </button>
      </div>
    </form>
  );
};

LessonForm.propTypes = {
  isEditing: PropTypes.bool,
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

LessonForm.defaultProps = {
  isEditing: false,
  initialData: null
};

export default LessonForm;