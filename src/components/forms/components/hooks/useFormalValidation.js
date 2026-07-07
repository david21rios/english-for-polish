// src/components/forms/components/hooks/useFormalValidation.js

import { useCallback, useEffect, useState } from "react";

import { VALIDATION_STATES } from "../utils/constants";
import { validateField, validateForm } from "../utils/validation";

const useFormValidation = (formData, validateOnChange = true) => {
  const [errors, setErrors] = useState({});
  const [validationState, setValidationState] = useState(
    VALIDATION_STATES.PENDING
  );
  const [touchedFields, setTouchedFields] = useState({});

  const validateBasicFields = useCallback(() => {
    const { errors: validationErrors, isValid } = validateForm(formData);

    setErrors(validationErrors);
    setValidationState(
      isValid ? VALIDATION_STATES.VALID : VALIDATION_STATES.INVALID
    );

    return isValid;
  }, [formData]);

  const getFieldValue = useCallback(
    (fieldName) => {
      if (fieldName === "title") {
        return formData.title || formData.titulo || "";
      }

      if (fieldName === "titulo") {
        return formData.titulo || formData.title || "";
      }

      if (fieldName === "description") {
        return formData.description || formData.descripcion || "";
      }

      if (fieldName === "descripcion") {
        return formData.descripcion || formData.description || "";
      }

      return formData[fieldName];
    },
    [formData]
  );

  const validateSingleField = useCallback((fieldName, value) => {
    const error = validateField(fieldName, value);

    setErrors((prev) => ({
      ...prev,
      [fieldName]: error
    }));

    return !error;
  }, []);

  const setFieldTouched = useCallback(
    (fieldName, isTouched = true) => {
      setTouchedFields((prev) => ({
        ...prev,
        [fieldName]: isTouched
      }));

      if (isTouched) {
        validateSingleField(fieldName, getFieldValue(fieldName));
      }
    },
    [getFieldValue, validateSingleField]
  );

  const resetValidation = useCallback(() => {
    setErrors({});
    setTouchedFields({});
    setValidationState(VALIDATION_STATES.PENDING);
  }, []);

  useEffect(() => {
    if (validateOnChange) {
      validateBasicFields();
    }
  }, [formData, validateOnChange, validateBasicFields]);

  const hasError = useCallback(
    (fieldName) => Boolean(errors[fieldName] && touchedFields[fieldName]),
    [errors, touchedFields]
  );

  const getFieldError = useCallback(
    (fieldName) => (touchedFields[fieldName] ? errors[fieldName] : ""),
    [errors, touchedFields]
  );

  const isFormValid = useCallback(() => {
    const titleError = errors.title || errors.titulo;

    return !errors.id && !titleError;
  }, [errors]);

  return {
    errors,
    validationState,
    touchedFields,
    validateAllFields: validateBasicFields,
    validateField: validateSingleField,
    setFieldTouched,
    resetValidation,
    hasError,
    getFieldError,
    isValid: isFormValid()
  };
};

export default useFormValidation;