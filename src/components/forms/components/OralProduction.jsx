// src/components/forms/components/OralProduction.jsx

import PropTypes from "prop-types";
import { FaPlus, FaTrash } from "react-icons/fa";

const normalizeExercise = (exercise = {}) => {
  if (typeof exercise === "string") {
    return {
      prompt: exercise,
      guide: "",
      recommendedDuration: "",
      criteria: []
    };
  }

  const legacyTime = exercise?.tiempo_sugerido
    ? `${exercise.tiempo_sugerido} minuto(s)`
    : "";

  return {
    prompt: exercise.prompt || exercise.consigna || exercise.instrucciones || "",
    guide: exercise.guide || exercise.guia || "",
    recommendedDuration:
      exercise.recommendedDuration ||
      exercise.duracion_recomendada ||
      legacyTime ||
      "",
    criteria: Array.isArray(exercise.criteria)
      ? exercise.criteria
      : Array.isArray(exercise.criterios)
        ? exercise.criterios
        : []
  };
};

const normalizeOralProduction = (oralProduction = {}) => ({
  title: oralProduction.title || oralProduction.titulo || "",
  description: oralProduction.description || oralProduction.descripcion || "",
  exercises: (
    Array.isArray(oralProduction.exercises)
      ? oralProduction.exercises
      : Array.isArray(oralProduction.ejercicios)
        ? oralProduction.ejercicios
        : []
  ).map(normalizeExercise)
});

const buildLegacyOralProduction = (oralProduction = {}) => ({
  titulo: oralProduction.title || "",
  descripcion: oralProduction.description || "",
  ejercicios: (oralProduction.exercises || []).map((exercise) => ({
    consigna: exercise.prompt || "",
    guia: exercise.guide || "",
    duracion_recomendada: exercise.recommendedDuration || "",
    criterios: exercise.criteria || []
  }))
});

const OralProduction = ({ formData, setFormData }) => {
  const oralProduction = normalizeOralProduction(
    formData.oralProduction || formData.produccion_oral || {}
  );

  const updateOralProduction = (updatedData) => {
    const normalizedOralProduction = normalizeOralProduction(updatedData);

    setFormData((prev) => ({
      ...prev,
      oralProduction: normalizedOralProduction,
      produccion_oral: buildLegacyOralProduction(normalizedOralProduction)
    }));
  };

  const handleChange = (field, value) => {
    updateOralProduction({
      ...oralProduction,
      [field]: value
    });
  };

  const handleAddExercise = () => {
    updateOralProduction({
      ...oralProduction,
      exercises: [
        ...oralProduction.exercises,
        {
          prompt: "",
          guide: "",
          recommendedDuration: "",
          criteria: []
        }
      ]
    });
  };

  const handleExerciseChange = (index, field, value) => {
    const newExercises = [...oralProduction.exercises];

    newExercises[index] = {
      ...newExercises[index],
      [field]: value
    };

    updateOralProduction({
      ...oralProduction,
      exercises: newExercises
    });
  };

  const handleRemoveExercise = (index) => {
    updateOralProduction({
      ...oralProduction,
      exercises: oralProduction.exercises.filter(
        (_, exerciseIndex) => exerciseIndex !== index
      )
    });
  };

  const handleAddCriterion = (exerciseIndex) => {
    const newExercises = [...oralProduction.exercises];

    newExercises[exerciseIndex] = {
      ...newExercises[exerciseIndex],
      criteria: [...(newExercises[exerciseIndex].criteria || []), ""]
    };

    updateOralProduction({
      ...oralProduction,
      exercises: newExercises
    });
  };

  const handleCriterionChange = (exerciseIndex, criterionIndex, value) => {
    const newExercises = [...oralProduction.exercises];
    const criteria = [...(newExercises[exerciseIndex].criteria || [])];

    criteria[criterionIndex] = value;

    newExercises[exerciseIndex] = {
      ...newExercises[exerciseIndex],
      criteria
    };

    updateOralProduction({
      ...oralProduction,
      exercises: newExercises
    });
  };

  const handleRemoveCriterion = (exerciseIndex, criterionIndex) => {
    const newExercises = [...oralProduction.exercises];

    newExercises[exerciseIndex] = {
      ...newExercises[exerciseIndex],
      criteria: (newExercises[exerciseIndex].criteria || []).filter(
        (_, index) => index !== criterionIndex
      )
    };

    updateOralProduction({
      ...oralProduction,
      exercises: newExercises
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tytuł zadania ustnego
        </label>

        <input
          type="text"
          value={oralProduction.title}
          onChange={(event) => handleChange("title", event.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="Wpisz tytuł aktywności ustnej..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Opis
        </label>

        <textarea
          value={oralProduction.description}
          onChange={(event) => handleChange("description", event.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          rows={4}
          placeholder="Wpisz opis aktywności ustnej..."
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ćwiczenia ustne
            </label>

            <p className="text-sm text-gray-500">
              Określ polecenie, wskazówki, sugerowany czas i kryteria samooceny.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddExercise}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <FaPlus className="mr-2" />
            Dodaj ćwiczenie
          </button>
        </div>

        {oralProduction.exercises.length > 0 ? (
          oralProduction.exercises.map((exercise, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white"
            >
              <div className="flex justify-between items-start gap-3">
                <h4 className="font-semibold text-gray-900">
                  Ćwiczenie ustne {index + 1}
                </h4>

                <button
                  type="button"
                  onClick={() => handleRemoveExercise(index)}
                  className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Usuń ćwiczenie ustne ${index + 1}`}
                  title="Usuń ćwiczenie"
                >
                  <FaTrash />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Polecenie
                </label>

                <textarea
                  value={exercise.prompt}
                  onChange={(event) =>
                    handleExerciseChange(index, "prompt", event.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  rows={3}
                  placeholder="Np. Nagraj krótką prezentację o sobie."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Wskazówki dla ucznia
                </label>

                <textarea
                  value={exercise.guide}
                  onChange={(event) =>
                    handleExerciseChange(index, "guide", event.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  rows={3}
                  placeholder="Np. Użyj powitań, swojego imienia i kraju."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sugerowany czas
                </label>

                <input
                  type="text"
                  value={exercise.recommendedDuration}
                  onChange={(event) =>
                    handleExerciseChange(
                      index,
                      "recommendedDuration",
                      event.target.value
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Np. 30 sekund, 1 minuta, 1–2 minuty"
                />

                <p className="mt-1 text-xs text-gray-500">
                  To wskazówka, a nie obowiązkowe ograniczenie.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Kryteria samooceny
                  </label>

                  <button
                    type="button"
                    onClick={() => handleAddCriterion(index)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    <FaPlus className="inline mr-2" />
                    Dodaj kryterium
                  </button>
                </div>

                {(exercise.criteria || []).map((criterion, criterionIndex) => (
                  <div key={criterionIndex} className="flex items-center gap-2">
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
                      placeholder="Np. Wymówiłem zdania wyraźnie."
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
        ) : (
          <p className="text-gray-500 text-sm italic">
            Nie zdefiniowano jeszcze ćwiczeń ustnych.
          </p>
        )}
      </div>
    </div>
  );
};

OralProduction.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired
};

export default OralProduction;