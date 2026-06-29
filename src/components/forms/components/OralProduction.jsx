import React from "react";
import { FaTrash, FaPlus } from "react-icons/fa";

const normalizeExercise = (exercise) => {
  if (typeof exercise === "string") {
    return {
      consigna: exercise,
      guia: "",
      duracion_recomendada: "",
      criterios: []
    };
  }

  const legacyTime = exercise?.tiempo_sugerido
    ? `${exercise.tiempo_sugerido} minuto(s)`
    : "";

  return {
    consigna: exercise?.consigna || exercise?.instrucciones || "",
    guia: exercise?.guia || "",
    duracion_recomendada:
      exercise?.duracion_recomendada || legacyTime || "",
    criterios: Array.isArray(exercise?.criterios)
      ? exercise.criterios
      : []
  };
};

const OralProduction = ({ formData, setFormData }) => {
  const produccionOral = formData.produccion_oral || {
    titulo: "",
    descripcion: "",
    ejercicios: []
  };

  const ejercicios = (produccionOral.ejercicios || []).map(normalizeExercise);

  const updateOralProduction = (updatedData) => {
    setFormData((prev) => ({
      ...prev,
      produccion_oral: {
        ...(prev.produccion_oral || {}),
        ...updatedData
      }
    }));
  };

  const handleChange = (field, value) => {
    updateOralProduction({ [field]: value });
  };

  const handleAddEjercicio = () => {
    updateOralProduction({
      ejercicios: [
        ...ejercicios,
        {
          consigna: "",
          guia: "",
          duracion_recomendada: "",
          criterios: []
        }
      ]
    });
  };

  const handleEjercicioChange = (index, field, value) => {
    const newEjercicios = [...ejercicios];

    newEjercicios[index] = {
      ...newEjercicios[index],
      [field]: value
    };

    updateOralProduction({ ejercicios: newEjercicios });
  };

  const handleRemoveEjercicio = (index) => {
    updateOralProduction({
      ejercicios: ejercicios.filter((_, i) => i !== index)
    });
  };

  const handleAddCriterio = (exerciseIndex) => {
    const newEjercicios = [...ejercicios];

    newEjercicios[exerciseIndex] = {
      ...newEjercicios[exerciseIndex],
      criterios: [
        ...(newEjercicios[exerciseIndex].criterios || []),
        ""
      ]
    };

    updateOralProduction({ ejercicios: newEjercicios });
  };

  const handleCriterioChange = (exerciseIndex, criterioIndex, value) => {
    const newEjercicios = [...ejercicios];
    const criterios = [...(newEjercicios[exerciseIndex].criterios || [])];

    criterios[criterioIndex] = value;

    newEjercicios[exerciseIndex] = {
      ...newEjercicios[exerciseIndex],
      criterios
    };

    updateOralProduction({ ejercicios: newEjercicios });
  };

  const handleRemoveCriterio = (exerciseIndex, criterioIndex) => {
    const newEjercicios = [...ejercicios];

    newEjercicios[exerciseIndex] = {
      ...newEjercicios[exerciseIndex],
      criterios: (newEjercicios[exerciseIndex].criterios || []).filter(
        (_, i) => i !== criterioIndex
      )
    };

    updateOralProduction({ ejercicios: newEjercicios });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Título de la Producción Oral
        </label>
        <input
          type="text"
          value={produccionOral.titulo || ""}
          onChange={(e) => handleChange("titulo", e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          placeholder="Título de la actividad oral"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          value={produccionOral.descripcion || ""}
          onChange={(e) => handleChange("descripcion", e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          rows={4}
          placeholder="Descripción de la actividad oral"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ejercicios orales
            </label>
            <p className="text-sm text-gray-500">
              Define consigna, guía, duración recomendada y criterios de autoevaluación.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddEjercicio}
            className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <FaPlus className="mr-2" />
            Añadir ejercicio
          </button>
        </div>

        {ejercicios.length > 0 ? (
          ejercicios.map((ejercicio, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white"
            >
              <div className="flex justify-between items-start gap-3">
                <h4 className="font-semibold text-gray-900">
                  Ejercicio oral {index + 1}
                </h4>

                <button
                  type="button"
                  onClick={() => handleRemoveEjercicio(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Consigna
                </label>
                <textarea
                  value={ejercicio.consigna || ""}
                  onChange={(e) =>
                    handleEjercicioChange(index, "consigna", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300"
                  rows={3}
                  placeholder="Ej: Graba una presentación corta sobre ti."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Guía para el estudiante
                </label>
                <textarea
                  value={ejercicio.guia || ""}
                  onChange={(e) =>
                    handleEjercicioChange(index, "guia", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300"
                  rows={3}
                  placeholder="Ej: Usa saludos, tu nombre y tu país."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Duración recomendada
                </label>
                <input
                  type="text"
                  value={ejercicio.duracion_recomendada || ""}
                  onChange={(e) =>
                    handleEjercicioChange(
                      index,
                      "duracion_recomendada",
                      e.target.value
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300"
                  placeholder="Ej: 30 segundos, 1 minuto, 1 a 2 minutos"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Es una orientación, no una restricción obligatoria.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Criterios de autoevaluación
                  </label>

                  <button
                    type="button"
                    onClick={() => handleAddCriterio(index)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    <FaPlus className="inline mr-2" />
                    Añadir criterio
                  </button>
                </div>

                {(ejercicio.criterios || []).map((criterio, criterioIndex) => (
                  <div key={criterioIndex} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={criterio}
                      onChange={(e) =>
                        handleCriterioChange(
                          index,
                          criterioIndex,
                          e.target.value
                        )
                      }
                      className="flex-1 rounded-md border-gray-300"
                      placeholder="Ej: Pronuncié claramente las frases."
                    />

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveCriterio(index, criterioIndex)
                      }
                      className="text-red-600"
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
            No hay ejercicios orales definidos.
          </p>
        )}
      </div>
    </div>
  );
};

export default OralProduction;