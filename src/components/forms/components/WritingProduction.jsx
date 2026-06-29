// components/WritingProduction/index.jsx
import React from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';

const WritingProduction = ({ formData, setFormData }) => {
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      produccion_escrita: {
        ...prev.produccion_escrita,
        [field]: value
      }
    }));
  };

  const handleAddEjercicio = () => {
    setFormData(prev => ({
      ...prev,
      produccion_escrita: {
        ...prev.produccion_escrita,
        ejercicios: [...(prev.produccion_escrita?.ejercicios || []), {
          instrucciones: '',
          criterios: [],
          extension_minima: '',
          extension_maxima: '',
          tiempo_sugerido: ''
        }]
      }
    }));
  };

  const handleEjercicioChange = (index, field, value) => {
    setFormData(prev => {
      const newEjercicios = [...prev.produccion_escrita.ejercicios];
      newEjercicios[index] = {
        ...newEjercicios[index],
        [field]: value
      };
      return {
        ...prev,
        produccion_escrita: {
          ...prev.produccion_escrita,
          ejercicios: newEjercicios
        }
      };
    });
  };

  const handleAddCriterio = (ejercicioIndex) => {
    setFormData(prev => {
      const newEjercicios = [...prev.produccion_escrita.ejercicios];
      newEjercicios[ejercicioIndex] = {
        ...newEjercicios[ejercicioIndex],
        criterios: [...(newEjercicios[ejercicioIndex].criterios || []), '']
      };
      return {
        ...prev,
        produccion_escrita: {
          ...prev.produccion_escrita,
          ejercicios: newEjercicios
        }
      };
    });
  };

  const handleCriterioChange = (ejercicioIndex, criterioIndex, value) => {
    setFormData(prev => {
      const newEjercicios = [...prev.produccion_escrita.ejercicios];
      const newCriterios = [...newEjercicios[ejercicioIndex].criterios];
      newCriterios[criterioIndex] = value;
      newEjercicios[ejercicioIndex] = {
        ...newEjercicios[ejercicioIndex],
        criterios: newCriterios
      };
      return {
        ...prev,
        produccion_escrita: {
          ...prev.produccion_escrita,
          ejercicios: newEjercicios
        }
      };
    });
  };

  const handleRemoveCriterio = (ejercicioIndex, criterioIndex) => {
    setFormData(prev => {
      const newEjercicios = [...prev.produccion_escrita.ejercicios];
      newEjercicios[ejercicioIndex] = {
        ...newEjercicios[ejercicioIndex],
        criterios: newEjercicios[ejercicioIndex].criterios.filter((_, i) => i !== criterioIndex)
      };
      return {
        ...prev,
        produccion_escrita: {
          ...prev.produccion_escrita,
          ejercicios: newEjercicios
        }
      };
    });
  };

  const handleRemoveEjercicio = (index) => {
    setFormData(prev => ({
      ...prev,
      produccion_escrita: {
        ...prev.produccion_escrita,
        ejercicios: prev.produccion_escrita.ejercicios.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Título de la Producción Escrita
        </label>
        <input
          type="text"
          value={formData.produccion_escrita?.titulo || ''}
          onChange={(e) => handleChange('titulo', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          placeholder="Título de la actividad de escritura"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          value={formData.produccion_escrita?.descripcion || ''}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          rows={4}
          placeholder="Descripción de la actividad de escritura"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">
            Ejercicios de Escritura
          </label>
          <button
            type="button"
            onClick={handleAddEjercicio}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <FaPlus className="mr-2" /> Añadir ejercicio
          </button>
        </div>

        {(formData.produccion_escrita?.ejercicios || []).map((ejercicio, index) => (
          <div key={index} className="border p-4 rounded-lg space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="text-lg font-medium">Ejercicio {index + 1}</h4>
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
                Instrucciones
              </label>
              <textarea
                value={ejercicio.instrucciones || ''}
                onChange={(e) => handleEjercicioChange(index, 'instrucciones', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300"
                rows={3}
                placeholder="Instrucciones detalladas del ejercicio"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Extensión mínima (palabras)
                </label>
                <input
                  type="number"
                  value={ejercicio.extension_minima || ''}
                  onChange={(e) => handleEjercicioChange(index, 'extension_minima', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Extensión máxima (palabras)
                </label>
                <input
                  type="number"
                  value={ejercicio.extension_maxima || ''}
                  onChange={(e) => handleEjercicioChange(index, 'extension_maxima', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tiempo sugerido (minutos)
                </label>
                <input
                  type="number"
                  value={ejercicio.tiempo_sugerido || ''}
                  onChange={(e) => handleEjercicioChange(index, 'tiempo_sugerido', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Criterios de evaluación
                </label>
                <button
                  type="button"
                  onClick={() => handleAddCriterio(index)}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <FaPlus className="inline mr-2" /> Añadir criterio
                </button>
              </div>

              {(ejercicio.criterios || []).map((criterio, criterioIndex) => (
                <div key={criterioIndex} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={criterio}
                    onChange={(e) => handleCriterioChange(index, criterioIndex, e.target.value)}
                    className="flex-1 rounded-md border-gray-300"
                    placeholder="Criterio de evaluación"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCriterio(index, criterioIndex)}
                    className="text-red-600"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WritingProduction;