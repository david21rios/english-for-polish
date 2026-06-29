// hooks/useFormValidation.js
import { useState, useCallback, useEffect } from 'react';
import { validateForm, validateField } from '../utils/validation';
import { VALIDATION_STATES } from '../utils/constants';

const useFormValidation = (formData, validateOnChange = true) => {
  // Estados
  const [errors, setErrors] = useState({});
  const [validationState, setValidationState] = useState(VALIDATION_STATES.PENDING);
  const [touchedFields, setTouchedFields] = useState({});

  // Validar campos básicos
  const validateBasicFields = useCallback(() => {
    const { errors: validationErrors, isValid } = validateForm(formData);

    setErrors(validationErrors);
    setValidationState(isValid ? VALIDATION_STATES.VALID : VALIDATION_STATES.INVALID);

    return isValid;
  }, [formData]);

  // Validar un campo específico
  const validateSingleField = useCallback((fieldName, value) => {
    const error = validateField(fieldName, value);

    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));

    return !error;
  }, []);

  // Marcar campo como tocado
  const setFieldTouched = useCallback((fieldName, isTouched = true) => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: isTouched
    }));

    // Validar el campo cuando es tocado
    if (isTouched) {
      validateSingleField(fieldName, formData[fieldName]);
    }
  }, [formData, validateSingleField]);

  // Resetear validación
  const resetValidation = useCallback(() => {
    setErrors({});
    setTouchedFields({});
    setValidationState(VALIDATION_STATES.PENDING);
  }, []);

  // Validación automática cuando cambian los datos
  useEffect(() => {
    if (validateOnChange) {
      validateBasicFields();
    }
  }, [formData, validateOnChange, validateBasicFields]);

  // Verificar si hay error en un campo
  const hasError = useCallback((fieldName) => {
    return Boolean(errors[fieldName] && touchedFields[fieldName]);
  }, [errors, touchedFields]);

  // Obtener mensaje de error
  const getFieldError = useCallback((fieldName) => {
    return touchedFields[fieldName] ? errors[fieldName] : '';
  }, [errors, touchedFields]);

  // Verificar si el formulario es válido
  const isFormValid = useCallback(() => {
    // Solo verificamos los campos básicos requeridos
    return !errors.id && !errors.titulo;
  }, [errors]);

  return {
    errors,
    validationState,
    touchedFields,
    validateAllFields: validateBasicFields, // Renombramos para mantener compatibilidad
    validateField: validateSingleField,
    setFieldTouched,
    resetValidation,
    hasError,
    getFieldError,
    isValid: isFormValid()
  };
};

export default useFormValidation;