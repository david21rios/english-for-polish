// components/InteractiveExercises/MatchingExercise.jsx
import React from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';

const MatchingExercise = ({ ejercicio, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...ejercicio,
      [field]: value
    });
  };

  const handleAddPar = () => {
    onChange({
      ...ejercicio,
      pares_izquierda: [...(ejercicio.pares_izquierda || []), ''],
      pares_derecha: [...(ejercicio.pares_derecha || []), ''],
      respuestas_correctas: {
        ...ejercicio.respuestas_correctas,
        [`par${ejercicio.pares_izquierda?.length || 0}`]: ''
      }
    });
  };

  const handleParChange = (side, index, value) => {
    const newPares = side === 'izquierda'
      ? [...ejercicio.pares_izquierda]
      : [...ejercicio.pares_derecha];

    newPares[index] = value;

    onChange({
      ...ejercicio,
      [`pares_${side}`]: newPares
    });
  };

  const handleRespuestaChange = (index, rightValue) => {
    onChange({
      ...ejercicio,
      respuestas_correctas: {
        ...ejercicio.respuestas_correctas,
        [`par${index}`]: rightValue
      }
    });
  };

  const handleRemovePar = (index) => {
    const newParesIzquierda = ejercicio.pares_izquierda.filter((_, i) => i !== index);
    const newParesDerecha = ejercicio.pares_derecha.filter((_, i) => i !== index);
    const newRespuestas = { ...ejercicio.respuestas_correctas };
    delete newRespuestas[`par${index}`];

    onChange({
      ...ejercicio,
      pares_izquierda: newParesIzquierda,
      pares_derecha: newParesDerecha,
      respuestas_correctas: newRespuestas
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
          placeholder="Instrucciones para relacionar los elementos..."
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">
            Pares a relacionar
          </label>
          <button
            type="button"
            onClick={handleAddPar}
            className="text-primary-600 hover:text-primary-700"
          >
            <FaPlus className="inline mr-2" /> Añadir par
          </button>
        </div>

        <div className="grid grid-cols-[1fr,auto,1fr] gap-4">
          <div className="font-medium text-center text-sm text-gray-700">
            Columna izquierda
          </div>
          <div />
          <div className="font-medium text-center text-sm text-gray-700">
            Columna derecha
          </div>
        </div>

        {(ejercicio.pares_izquierda || []).map((_, index) => (
          <div key={index} className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
            <input
              type="text"
              value={ejercicio.pares_izquierda[index] || ''}
              onChange={(e) => handleParChange('izquierda', index, e.target.value)}
              className="rounded-md border-gray-300"
              placeholder="Elemento izquierdo"
            />

            <button
              type="button"
              onClick={() => handleRemovePar(index)}
              className="text-red-600"
            >
              <FaTrash />
            </button>

            <select
              value={ejercicio.respuestas_correctas[`par${index}`] || ''}
              onChange={(e) => handleRespuestaChange(index, e.target.value)}
              className="rounded-md border-gray-300"
            >
              <option value="">Selecciona la pareja correcta</option>
              {ejercicio.pares_derecha.map((opcion, i) => (
                <option key={i} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {ejercicio.pares_derecha?.map((par, index) => (
          <input
            key={index}
            type="text"
            value={par}
            onChange={(e) => handleParChange('derecha', index, e.target.value)}
            className="block w-full rounded-md border-gray-300"
            placeholder={`Elemento derecho ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default MatchingExercise;