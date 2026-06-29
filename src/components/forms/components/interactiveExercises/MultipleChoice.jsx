// components/InteractiveExercises/MultipleChoice.jsx
import React from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';

const MultipleChoice = ({ ejercicio, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...ejercicio,
      [field]: value
    });
  };

  const handleAddOpcion = () => {
    onChange({
      ...ejercicio,
      opciones: [...(ejercicio.opciones || []), '']
    });
  };

  const handleOpcionChange = (index, value) => {
    const newOpciones = [...ejercicio.opciones];
    newOpciones[index] = value;
    onChange({
      ...ejercicio,
      opciones: newOpciones
    });
  };

  const handleRemoveOpcion = (index) => {
    const newOpciones = ejercicio.opciones.filter((_, i) => i !== index);
    onChange({
      ...ejercicio,
      opciones: newOpciones,
      respuesta_correcta: ejercicio.respuesta_correcta === ejercicio.opciones[index]
        ? ''
        : ejercicio.respuesta_correcta
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Pregunta
        </label>
        <input
          type="text"
          value={ejercicio.pregunta || ''}
          onChange={(e) => handleChange('pregunta', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          placeholder="Escribe la pregunta..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Instrucciones
        </label>
        <textarea
          value={ejercicio.instrucciones || ''}
          onChange={(e) => handleChange('instrucciones', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          rows={2}
          placeholder="Instrucciones para responder..."
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">
            Opciones
          </label>
          <button
            type="button"
            onClick={handleAddOpcion}
            className="text-primary-600 hover:text-primary-700"
          >
            <FaPlus className="inline mr-2" /> Añadir opción
          </button>
        </div>

        {(ejercicio.opciones || []).map((opcion, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="radio"
              checked={ejercicio.respuesta_correcta === opcion}
              onChange={() => handleChange('respuesta_correcta', opcion)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <input
              type="text"
              value={opcion}
              onChange={(e) => handleOpcionChange(index, e.target.value)}
              className="flex-1 rounded-md border-gray-300"
              placeholder={`Opción ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => handleRemoveOpcion(index)}
              className="text-red-600"
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>

      {ejercicio.opciones?.length > 0 && !ejercicio.respuesta_correcta && (
        <p className="text-sm text-yellow-600">
          No olvides seleccionar la respuesta correcta
        </p>
      )}
    </div>
  );
};

export default MultipleChoice;