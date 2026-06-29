// src/components/forms/components/Reading.jsx

import React from "react";
import { FaTrash, FaPlus } from "react-icons/fa";

const normalizeReading = (lectura = {}) => {
  const preguntas = Array.isArray(lectura.preguntas)
    ? lectura.preguntas
    : [];

  return {
    titulo: lectura.titulo || "",
    autor: lectura.autor || "AI Tutor",
    contenido: lectura.contenido || "",
    preguntas: preguntas.map((item) => ({
      pregunta: item.pregunta || item.question || "",
      respuesta: item.respuesta || item.answer || "",
      opciones: Array.isArray(item.opciones)
        ? item.opciones
        : Array.isArray(item.options)
        ? item.options
        : [],
      respuesta_correcta:
        item.respuesta_correcta ||
        item.correctAnswer ||
        item.respuesta ||
        item.answer ||
        "",
      tipo: item.tipo || "comprension"
    }))
  };
};

const Reading = ({ formData, setFormData }) => {
  const lectura = normalizeReading(formData.lectura || {});

  const updateReading = (updatedReading) => {
    setFormData((prev) => ({
      ...prev,
      lectura: {
        titulo: updatedReading.titulo || "",
        autor: updatedReading.autor || "",
        contenido: updatedReading.contenido || "",
        preguntas: updatedReading.preguntas || []
      }
    }));
  };

  const handleChange = (field, value) => {
    updateReading({
      ...lectura,
      [field]: value
    });
  };

  const handleAddPregunta = () => {
    updateReading({
      ...lectura,
      preguntas: [
        ...lectura.preguntas,
        {
          pregunta: "",
          respuesta: "",
          opciones: [],
          respuesta_correcta: "",
          tipo: "comprension"
        }
      ]
    });
  };

  const handlePreguntaChange = (index, field, value) => {
    const newPreguntas = [...lectura.preguntas];

    newPreguntas[index] = {
      ...newPreguntas[index],
      [field]: value
    };

    if (field === "respuesta") {
      newPreguntas[index].respuesta_correcta = value;
    }

    updateReading({
      ...lectura,
      preguntas: newPreguntas
    });
  };

  const handleAddOpcion = (preguntaIndex) => {
    const newPreguntas = [...lectura.preguntas];

    newPreguntas[preguntaIndex] = {
      ...newPreguntas[preguntaIndex],
      opciones: [...(newPreguntas[preguntaIndex].opciones || []), ""]
    };

    updateReading({
      ...lectura,
      preguntas: newPreguntas
    });
  };

  const handleOpcionChange = (preguntaIndex, opcionIndex, value) => {
    const newPreguntas = [...lectura.preguntas];
    const opciones = [...(newPreguntas[preguntaIndex].opciones || [])];

    const oldValue = opciones[opcionIndex];
    opciones[opcionIndex] = value;

    newPreguntas[preguntaIndex] = {
      ...newPreguntas[preguntaIndex],
      opciones
    };

    if (newPreguntas[preguntaIndex].respuesta_correcta === oldValue) {
      newPreguntas[preguntaIndex].respuesta_correcta = value;
      newPreguntas[preguntaIndex].respuesta = value;
    }

    updateReading({
      ...lectura,
      preguntas: newPreguntas
    });
  };

  const handleRemoveOpcion = (preguntaIndex, opcionIndex) => {
    const newPreguntas = [...lectura.preguntas];
    const opciones = [...(newPreguntas[preguntaIndex].opciones || [])];
    const removedValue = opciones[opcionIndex];

    const filteredOptions = opciones.filter((_, i) => i !== opcionIndex);

    newPreguntas[preguntaIndex] = {
      ...newPreguntas[preguntaIndex],
      opciones: filteredOptions
    };

    if (newPreguntas[preguntaIndex].respuesta_correcta === removedValue) {
      newPreguntas[preguntaIndex].respuesta_correcta = "";
      newPreguntas[preguntaIndex].respuesta = "";
    }

    updateReading({
      ...lectura,
      preguntas: newPreguntas
    });
  };

  const handleRemovePregunta = (index) => {
    updateReading({
      ...lectura,
      preguntas: lectura.preguntas.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Título de la lectura
        </label>
        <input
          type="text"
          value={lectura.titulo}
          onChange={(e) => handleChange("titulo", e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          placeholder="Título de la lectura"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Autor
        </label>
        <input
          type="text"
          value={lectura.autor}
          onChange={(e) => handleChange("autor", e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          placeholder="Autor"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Contenido
        </label>
        <textarea
          value={lectura.contenido}
          onChange={(e) => handleChange("contenido", e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          rows={8}
          placeholder="Texto de lectura"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Preguntas de comprensión
            </label>
            <p className="text-sm text-gray-500">
              Puedes usar preguntas abiertas o preguntas con opciones.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddPregunta}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            <FaPlus className="mr-2" />
            Añadir pregunta
          </button>
        </div>

        {lectura.preguntas.length > 0 ? (
          <div className="space-y-4">
            {lectura.preguntas.map((pregunta, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Pregunta {index + 1}
                    </label>
                    <input
                      type="text"
                      value={pregunta.pregunta}
                      onChange={(e) =>
                        handlePreguntaChange(index, "pregunta", e.target.value)
                      }
                      className="mt-1 block w-full rounded-md border-gray-300"
                      placeholder="Escribe la pregunta..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemovePregunta(index)}
                    className="mt-7 text-red-600 hover:text-red-800"
                  >
                    <FaTrash />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Respuesta esperada
                  </label>
                  <input
                    type="text"
                    value={pregunta.respuesta || ""}
                    onChange={(e) =>
                      handlePreguntaChange(index, "respuesta", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300"
                    placeholder="Respuesta esperada"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                      Opciones
                    </label>

                    <button
                      type="button"
                      onClick={() => handleAddOpcion(index)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <FaPlus className="inline mr-2" />
                      Añadir opción
                    </button>
                  </div>

                  {(pregunta.opciones || []).map((opcion, opcionIndex) => (
                    <div key={opcionIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={pregunta.respuesta_correcta === opcion}
                        onChange={() => {
                          handlePreguntaChange(
                            index,
                            "respuesta_correcta",
                            opcion
                          );
                          handlePreguntaChange(index, "respuesta", opcion);
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />

                      <input
                        type="text"
                        value={opcion}
                        onChange={(e) =>
                          handleOpcionChange(index, opcionIndex, e.target.value)
                        }
                        className="flex-1 rounded-md border-gray-300"
                        placeholder={`Opción ${opcionIndex + 1}`}
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveOpcion(index, opcionIndex)}
                        className="text-red-600"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}

                  {(pregunta.opciones || []).length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      Sin opciones. Esta pregunta será de respuesta abierta.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">
            No hay preguntas de lectura definidas.
          </p>
        )}
      </div>
    </div>
  );
};

export default Reading;