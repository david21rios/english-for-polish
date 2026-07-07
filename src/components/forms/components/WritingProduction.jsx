// src/components/forms/components/WritingProduction.jsx

import PropTypes from "prop-types";
import { FaPlus, FaTrash } from "react-icons/fa";

const normalizeExercise = (exercise = {}) => ({
  instructions: exercise.instructions || exercise.instrucciones || "",
  criteria: Array.isArray(exercise.criteria)
    ? exercise.criteria
    : Array.isArray(exercise.criterios)
      ? exercise.criterios
      : [],
  minWords:
    exercise.minWords ||
    exercise.extension_minima ||
    "",
  maxWords:
    exercise.maxWords ||
    exercise.extension_maxima ||
    "",
  suggestedMinutes:
    exercise.suggestedMinutes ||
    exercise.tiempo_sugerido ||
    ""
});

const normalizeWritingProduction = (writingProduction = {}) => ({
  title: writingProduction.title || writingProduction.titulo || "",
  description:
    writingProduction.description || writingProduction.descripcion || "",
  exercises: (
    Array.isArray(writingProduction.exercises)
      ? writingProduction.exercises
      : Array.isArray(writingProduction.ejercicios)
        ? writingProduction.ejercicios
        : []
  ).map(normalizeExercise)
});

const buildLegacyWritingProduction = (writingProduction = {}) => ({
  titulo: writingProduction.title || "",
  descripcion: writingProduction.description || "",
  ejercicios: (writingProduction.exercises || []).map((exercise) => ({
    instrucciones: exercise.instructions || "",
    criterios: exercise.criteria || [],
    extension_minima: exercise.minWords || "",
    extension_maxima: exercise.maxWords || "",
    tiempo_sugerido: exercise.suggestedMinutes || ""
  }))
});

const WritingProduction = ({ formData, setFormData }) => {
  const writingProduction = normalizeWritingProduction(
    formData.writingProduction || formData.produccion_escrita || {}
  );

  const updateWritingProduction = (updatedWritingProduction) => {
    const normalizedWritingProduction = normalizeWritingProduction(
      updatedWritingProduction
    );

    setFormData((prev) => ({
      ...prev,

      // Canonical model.
      writingProduction: normalizedWritingProduction,

      // Legacy compatibility during migration.
      produccion_escrita: buildLegacyWritingProduction(
        normalizedWritingProduction
      )
    }));
  };

  const handleChange = (field, value) => {
    updateWritingProduction({
      ...writingProduction,
      [field]: value
    });
  };

  const handleAddExercise = () => {
    updateWritingProduction({
      ...writingProduction,
      exercises: [
        ...writingProduction.exercises,
        {
          instructions: "",
          criteria: [],
          minWords: "",
          maxWords: "",
          suggestedMinutes: ""
        }
      ]
    });
  };

  const handleExerciseChange = (index, field, value) => {
    const newExercises = [...writingProduction.exercises];

    newExercises[index] = {
      ...newExercises[index],
      [field]: value
    };

    updateWritingProduction({
      ...writingProduction,
      exercises: newExercises
    });
  };

  const handleAddCriterion = (exerciseIndex) => {
    const newExercises = [...writingProduction.exercises];

    newExercises[exerciseIndex] = {
      ...newExercises[exerciseIndex],
      criteria: [...(newExercises[exerciseIndex].criteria || []), ""]
    };

    updateWritingProduction({
      ...writingProduction,
      exercises: newExercises
    });
  };

  const handleCriterionChange = (
    exerciseIndex,
    criterionIndex,
    value
  ) => {
    const newExercises = [...writingProduction.exercises];
    const newCriteria = [
      ...(newExercises[exerciseIndex].criteria || [])
    ];

    newCriteria[criterionIndex] = value;

    newExercises[exerciseIndex] = {
      ...newExercises[exerciseIndex],
      criteria: newCriteria
    };

    updateWritingProduction({
      ...writingProduction,
      exercises: newExercises
    });
  };

  const handleRemoveCriterion = (
    exerciseIndex,
    criterionIndex
  ) => {
    const newExercises = [...writingProduction.exercises];

    newExercises[exerciseIndex] = {
      ...newExercises[exerciseIndex],
      criteria: newExercises[exerciseIndex].criteria.filter(
        (_, index) => index !== criterionIndex
      )
    };

    updateWritingProduction({
      ...writingProduction,
      exercises: newExercises
    });
  };

  const handleRemoveExercise = (index) => {
    updateWritingProduction({
      ...writingProduction,
      exercises: writingProduction.exercises.filter(
        (_, exerciseIndex) => exerciseIndex !== index
      )
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tytuł zadania pisemnego
        </label>

        <input
          type="text"
          value={writingProduction.title}
          onChange={(event) =>
            handleChange("title", event.target.value)
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="Wpisz tytuł aktywności pisemnej..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Opis
        </label>

        <textarea
          value={writingProduction.description}
          onChange={(event) =>
            handleChange("description", event.target.value)
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          rows={4}
          placeholder="Wpisz opis aktywności pisemnej..."
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <label className="block text-sm font-medium text-gray-700">
            Ćwiczenia pisemne
          </label>

          <button
            type="button"
            onClick={handleAddExercise}
            className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <FaPlus className="mr-2" />
            Dodaj ćwiczenie
          </button>
        </div>

        {writingProduction.exercises.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Nie zdefiniowano jeszcze ćwiczeń pisemnych.
          </p>
        ) : (
          writingProduction.exercises.map((exercise, index) => (
            <div
              key={index}
              className="border border-gray-200 p-4 rounded-lg space-y-4 bg-white"
            >
              <div className="flex justify-between items-start gap-3">
                <h4 className="text-lg font-medium">
                  Ćwiczenie {index + 1}
                </h4>

                <button
                  type="button"
                  onClick={() => handleRemoveExercise(index)}
                  className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Usuń ćwiczenie ${index + 1}`}
                  title="Usuń ćwiczenie"
                >
                  <FaTrash />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Instrukcje
                </label>

                <textarea
                  value={exercise.instructions}
                  onChange={(event) =>
                    handleExerciseChange(
                      index,
                      "instructions",
                      event.target.value
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  rows={3}
                  placeholder="Wpisz szczegółowe instrukcje ćwiczenia..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Minimalna liczba słów
                  </label>

                  <input
                    type="number"
                    value={exercise.minWords}
                    onChange={(event) =>
                      handleExerciseChange(
                        index,
                        "minWords",
                        event.target.value
                      )
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maksymalna liczba słów
                  </label>

                  <input
                    type="number"
                    value={exercise.maxWords}
                    onChange={(event) =>
                      handleExerciseChange(
                        index,
                        "maxWords",
                        event.target.value
                      )
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sugerowany czas
                  </label>

                  <input
                    type="number"
                    value={exercise.suggestedMinutes}
                    onChange={(event) =>
                      handleExerciseChange(
                        index,
                        "suggestedMinutes",
                        event.target.value
                      )
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    min="0"
                    placeholder="Minuty"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Kryteria oceny
                  </label>

                  <button
                    type="button"
                    onClick={() => handleAddCriterion(index)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <FaPlus className="inline mr-2" />
                    Dodaj kryterium
                  </button>
                </div>

                {(exercise.criteria || []).map((criterion, criterionIndex) => (
                  <div
                    key={criterionIndex}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={criterion}
                      onChange={(event) =>
                        handleCriterionChange(
                          index,
                          criterionIndex,
                          event.target.value
                        )
                      }
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Wpisz kryterium oceny..."
                    />

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveCriterion(index, criterionIndex)
                      }
                      className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Usuń kryterium ${criterionIndex + 1}`}
                      title="Usuń kryterium"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

WritingProduction.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired
};

export default WritingProduction;