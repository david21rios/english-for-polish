// hooks/useFormData.js
import { useState, useCallback } from 'react';
import { getEmptyLessonStructure } from '../utils/initialState';
import { deepClone, handleError } from '../utils/helpers';

const useFormData = (initialData = null, isEditing = false) => {
  // Estado inicial del formulario
  const [formData, setFormData] = useState(() => {
    try {
      if (isEditing && initialData) {
        return {
          ...getEmptyLessonStructure(),
          ...initialData
        };
      }
      return getEmptyLessonStructure();
    } catch (error) {
      handleError(error, 'Error al inicializar el formulario');
      return getEmptyLessonStructure();
    }
  });

  // Estado para trackear cambios sin guardar
  const [isDirty, setIsDirty] = useState(false);

  // Función para actualizar un campo específico
  const updateField = useCallback((fieldName, value) => {
    setFormData(prev => {
      const newData = { ...prev, [fieldName]: value };
      setIsDirty(true);
      return newData;
    });
  }, []);

  // Función para actualizar campos anidados
  const updateNestedField = useCallback((path, value) => {
    setFormData(prev => {
      const newData = deepClone(prev);
      let current = newData;
      const fields = path.split('.');
      const lastField = fields.pop();

      fields.forEach(field => {
        if (!current[field]) {
          current[field] = {};
        }
        current = current[field];
      });

      current[lastField] = value;
      setIsDirty(true);
      return newData;
    });
  }, []);

  // Función para actualizar arrays
  const updateArray = useCallback((fieldName, index, value) => {
    setFormData(prev => {
      const newArray = [...prev[fieldName]];
      newArray[index] = value;
      setIsDirty(true);
      return { ...prev, [fieldName]: newArray };
    });
  }, []);

  // Función para añadir elemento a un array
  const addToArray = useCallback((fieldName, value) => {
    setFormData(prev => {
      const newArray = [...(prev[fieldName] || []), value];
      setIsDirty(true);
      return { ...prev, [fieldName]: newArray };
    });
  }, []);

  // Función para eliminar elemento de un array
  const removeFromArray = useCallback((fieldName, index) => {
    setFormData(prev => {
      const newArray = prev[fieldName].filter((_, i) => i !== index);
      setIsDirty(true);
      return { ...prev, [fieldName]: newArray };
    });
  }, []);

  // Función para resetear el formulario
  const resetForm = useCallback(() => {
    setFormData(getEmptyLessonStructure());
    setIsDirty(false);
  }, []);

  // Función para guardar el estado actual como borrador
  const saveDraft = useCallback(() => {
    try {
      const draft = {
        ...formData,
        metadata: {
          ...formData.metadata,
          updatedAt: new Date().toISOString(),
          status: 'draft'
        }
      };
      localStorage.setItem('lessonFormDraft', JSON.stringify(draft));
      setIsDirty(false);
      return true;
    } catch (error) {
      handleError(error, 'Error al guardar el borrador');
      return false;
    }
  }, [formData]);

  // Función para cargar un borrador guardado
  const loadDraft = useCallback(() => {
    try {
      const draft = localStorage.getItem('lessonFormDraft');
      if (draft) {
        setFormData(JSON.parse(draft));
        return true;
      }
      return false;
    } catch (error) {
      handleError(error, 'Error al cargar el borrador');
      return false;
    }
  }, []);

  return {
    formData,
    setFormData,
    isDirty,
    updateField,
    updateNestedField,
    updateArray,
    addToArray,
    removeFromArray,
    resetForm,
    saveDraft,
    loadDraft
  };
};

export default useFormData;