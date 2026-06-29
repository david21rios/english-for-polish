// components/Evaluation/index.jsx
import React from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';

const Evaluation = ({ formData, setFormData }) => {
  const handleAutoevaluacionChange = (value) => {
    setFormData(prev => ({
      ...prev,
      evaluacion: {
        ...prev.evaluacion,
        autoevaluacion: value
      }
    }));
  };

  const handleAddPregunta = () => {
    setFormData(prev => ({
      ...prev,
      evaluacion: {
        ...prev.evaluacion,
        cuestionario: [
          ...(prev.evaluacion.cuestionario || []),
          { pregunta: '', opciones: [], respuesta_correcta: '' }
        ]
      }
    }));
  };

  const handlePreguntaChange = (index, field, value) => {
    setFormData(prev => {
      const newCuestionario = [...prev.evaluacion.cuestionario];
      newCuestionario[index] = { ...newCuestionario[index], [field]: value };
      return {
        ...prev,
        evaluacion: {
          ...prev.evaluacion,
          cuestionario: newCuestionario
        }
      };
    });
  };

  const handleAddOpcion = (preguntaIndex) => {
    setFormData(prev => {
      const newCuestionario = [...prev.evaluacion.cuestionario];
      const newOpciones = [...(newCuestionario[preguntaIndex].opciones || []), ''];
      newCuestionario[preguntaIndex] = {
        ...newCuestionario[preguntaIndex],
        opciones: newOpciones
      };
      return {
        ...prev,
        evaluacion: {
          ...prev.evaluacion,
          cuestionario: newCuestionario
        }
      };
    });
  };

  const handleOpcionChange = (preguntaIndex, opcionIndex, value) => {
    setFormData(prev => {
      const newCuestionario = [...prev.evaluacion.cuestionario];
      const newOpciones = [...newCuestionario[preguntaIndex].opciones];
      newOpciones[opcionIndex] = value;
      newCuestionario[preguntaIndex] = {
        ...newCuestionario[preguntaIndex],
        opciones: newOpciones
      };
      return {
        ...prev,
        evaluacion: {
          ...prev.evaluacion,
          cuestionario: newCuestionario
        }
      };
    });
  };

  const handleRemoveOpcion = (preguntaIndex, opcionIndex) => {
    setFormData(prev => {
      const newCuestionario = [...prev.evaluacion.cuestionario];
      const newOpciones = newCuestionario[preguntaIndex].opciones.filter((_, i) => i !== opcionIndex);
      newCuestionario[preguntaIndex] = {
        ...newCuestionario[preguntaIndex],
        opciones: newOpciones
      };
      return {
        ...prev,
        evaluacion: {
          ...prev.evaluacion,
          cuestionario: newCuestionario
        }
      };
    });
  };

  const handleRemovePregunta = (index) => {
    setFormData(prev => ({
      ...prev,
      evaluacion: {
        ...prev.evaluacion,
        cuestionario: prev.evaluacion.cuestionario.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Autoevaluación
        </label>
        <textarea
          value={formData.evaluacion?.autoevaluacion || ''}
          onChange={(e) => handleAutoevaluacionChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          rows={4}
          placeholder="Describe los criterios de autoevaluación..."
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Cuestionario</h3>
          <button
            type="button"
            onClick={handleAddPregunta}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            <FaPlus className="mr-2" /> Añadir pregunta
          </button>
        </div>

        {formData.evaluacion?.cuestionario.map((pregunta, index) => (
          <div key={index} className="border p-4 rounded-lg space-y-4">
            <div className="flex items-start gap-2">
              <input
                type="text"
                value={pregunta.pregunta}
                onChange={(e) => handlePreguntaChange(index, 'pregunta', e.target.value)}
                className="flex-1 rounded-md"
                placeholder="Escribe la pregunta..."
              />
              <button
                type="button"
                onClick={() => handleRemovePregunta(index)}
                className="text-red-600"
              >
                <FaTrash />
              </button>
            </div>

            <div className="space-y-2 pl-4">
              {pregunta.opciones.map((opcion, opcionIndex) => (
                <div key={opcionIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={pregunta.respuesta_correcta === opcion}
                    onChange={() => handlePreguntaChange(index, 'respuesta_correcta', opcion)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    value={opcion}
                    onChange={(e) => handleOpcionChange(index, opcionIndex, e.target.value)}
                    className="flex-1 rounded-md"
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

              <button
                type="button"
                onClick={() => handleAddOpcion(index)}
                className="text-primary-600"
              >
                <FaPlus className="inline mr-2" /> Añadir opción
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Evaluation;