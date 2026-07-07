// src/components/forms/components/hooks/useFormData.js

import { useCallback, useEffect, useState } from "react";

import { deepClone, handleError } from "../utils/helpers";
import { getEmptyLessonStructure } from "../utils/initialState";

const DRAFT_STORAGE_KEY = "lessonFormDraft";

const buildInitialFormData = (initialData = null, isEditing = false) => {
  if (isEditing && initialData) {
    return {
      ...getEmptyLessonStructure(),
      ...initialData
    };
  }

  return getEmptyLessonStructure();
};

const useFormData = (initialData = null, isEditing = false) => {
  const [formData, setFormData] = useState(() => {
    try {
      return buildInitialFormData(initialData, isEditing);
    } catch (error) {
      handleError(error, "Could not initialize lesson form.");
      return getEmptyLessonStructure();
    }
  });

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    try {
      setFormData(buildInitialFormData(initialData, isEditing));
      setIsDirty(false);
    } catch (error) {
      handleError(error, "Could not sync lesson form data.");
    }
  }, [initialData, isEditing]);

  const updateField = useCallback((fieldName, value) => {
    setFormData((prev) => {
      setIsDirty(true);
      return { ...prev, [fieldName]: value };
    });
  }, []);

  const updateNestedField = useCallback((path, value) => {
    setFormData((prev) => {
      const newData = deepClone(prev) || {};
      let current = newData;
      const fields = path.split(".");
      const lastField = fields.pop();

      fields.forEach((field) => {
        if (!current[field] || typeof current[field] !== "object") {
          current[field] = {};
        }
        current = current[field];
      });

      current[lastField] = value;
      setIsDirty(true);
      return newData;
    });
  }, []);

  const updateArray = useCallback((fieldName, index, value) => {
    setFormData((prev) => {
      const currentArray = Array.isArray(prev[fieldName]) ? prev[fieldName] : [];
      const newArray = [...currentArray];

      newArray[index] = value;
      setIsDirty(true);

      return { ...prev, [fieldName]: newArray };
    });
  }, []);

  const addToArray = useCallback((fieldName, value) => {
    setFormData((prev) => {
      const currentArray = Array.isArray(prev[fieldName]) ? prev[fieldName] : [];

      setIsDirty(true);

      return {
        ...prev,
        [fieldName]: [...currentArray, value]
      };
    });
  }, []);

  const removeFromArray = useCallback((fieldName, index) => {
    setFormData((prev) => {
      const currentArray = Array.isArray(prev[fieldName]) ? prev[fieldName] : [];

      setIsDirty(true);

      return {
        ...prev,
        [fieldName]: currentArray.filter((_, itemIndex) => itemIndex !== index)
      };
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData(getEmptyLessonStructure());
    setIsDirty(false);
  }, []);

  const saveDraft = useCallback(() => {
    try {
      const draft = {
        ...formData,
        status: "draft",
        metadata: {
          ...(formData.metadata || {}),
          updatedAt: new Date().toISOString(),
          status: "draft"
        }
      };

      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setIsDirty(false);

      return true;
    } catch (error) {
      handleError(error, "Could not save lesson draft.");
      return false;
    }
  }, [formData]);

  const loadDraft = useCallback(() => {
    try {
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);

      if (!draft) return false;

      setFormData({
        ...getEmptyLessonStructure(),
        ...JSON.parse(draft)
      });

      setIsDirty(false);
      return true;
    } catch (error) {
      handleError(error, "Could not load lesson draft.");
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