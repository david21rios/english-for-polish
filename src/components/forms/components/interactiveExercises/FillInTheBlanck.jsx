// components/InteractiveExercises/FillInTheBlank.jsx
import React from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';

const FillInTheBlank = ({ ejercicio, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...ejercicio,
      [field]: value
    });
  };

  const handleAddPalabra = () => {
    onChange({
      ...ejercicio,
      palabras: [...(ejercicio.palabras || []), ''],
      respuestas: {
        ...ejercicio.respuestas,
        [`blank${ejercicio.palabras?.length || 0}`]: ''
      }
    });
  };

  const handlePalabraChange = (index, value) => {
    const newPalabras = [...ejercicio.palabras];
    newPalabras[index] = value;
    onChange({
      ...ejercicio,
      palabras: newPalabras
    });
  };

  const handleRespuestaChange = (blankId, value) => {
    onChange({
      ...ejercicio,
      respuestas: {
        ...ejercicio.respuestas,
        [blankId]: value
      }
    });
  };

  const handleRemovePalabra = (index) => {
    const newPalabras = ejercicio.palabras.filter((_, i) => i !== index);
    const newRespuestas = { ...ejercicio.respuestas };
    delete newRespuestas[`blank${index}`];

    onChange({
      ...ejercicio,
      palabras: newPalabras,
      respuestas: newRespuestas
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Instrucciones
        </label>
        <textarea
          value={ejercicio.instrucciones || ''}
          onChange={(e) => handleChange('instrucciones', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          rows={2}
          placeholder="Instrucciones para completar el ejercicio..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Texto con espacios en blanco
        </label>
        <textarea
          value={ejercicio.texto || ''}
          onChange={(e) => handleChange('texto', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          rows={4}
          placeholder="Escribe el texto usando ___ para los espacios en blanco..."
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">
            Palabras y Respuestas
          </label>
          <button
            type="button"
            onClick={handleAddPalabra}
            className="text-primary-600 hover:text-primary-700"
          >
            <FaPlus className="inline mr-2" /> Añadir palabra
          </button>
        </div>

        {(ejercicio.palabras || []).map((palabra, index) => (
          <div key={index} className="grid grid-cols-2 gap-4 items-center">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={palabra}
                onChange={(e) => handlePalabraChange(index, e.target.value)}
                className="flex-1 rounded-md border-gray-300"
                placeholder="Palabra visible"
              />
              <button
                type="button"
                onClick={() => handleRemovePalabra(index)}
                className="text-red-600"
              >
                <FaTrash />
              </button>
            </div>
            <input
              type="text"
              value={ejercicio.respuestas[`blank${index}`] || ''}
              onChange={(e) => handleRespuestaChange(`blank${index}`, e.target.value)}
              className="rounded-md border-gray-300"
              placeholder="Respuesta correcta"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FillInTheBlank;