// components/InteractiveExercises/index.jsx
import React from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import MultipleChoice from './MultipleChoice';
import FillInTheBlank from './FillInTheBlanck.jsx';
import MatchingExercise from './MatchingExercise';
import OrderExercise from './OrderExercise';

const InteractiveExercises = ({ formData, setFormData }) => {
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      ejercicios_interactivos: {
        ...prev.ejercicios_interactivos,
        [field]: value
      }
    }));
  };

  const handleAddEjercicio = (tipo) => {
    const nuevoEjercicio = {
      tipo,
      pregunta: '',
      instrucciones: '',
      ...(tipo === 'multiple_choice' && {
        opciones: [],
        respuesta_correcta: ''
      }),
      ...(tipo === 'fill_blank' && {
        texto: '',
        palabras: [],
        respuestas: {}
      }),
      ...(tipo === 'matching' && {
        pares_izquierda: [],
        pares_derecha: [],
        respuestas_correctas: {}
      }),
      ...(tipo === 'ordering' && {
        elementos: [],
        orden_correcto: []
      })
    };

    setFormData(prev => ({
      ...prev,
      ejercicios_interactivos: {
        ...prev.ejercicios_interactivos,
        ejercicios: [...(prev.ejercicios_interactivos?.ejercicios || []), nuevoEjercicio]
      }
    }));
  };

  const handleRemoveEjercicio = (index) => {
    setFormData(prev => ({
      ...prev,
      ejercicios_interactivos: {
        ...prev.ejercicios_interactivos,
        ejercicios: prev.ejercicios_interactivos.ejercicios.filter((_, i) => i !== index)
      }
    }));
  };

  const handleUpdateEjercicio = (index, updatedEjercicio) => {
    setFormData(prev => {
      const newEjercicios = [...prev.ejercicios_interactivos.ejercicios];
      newEjercicios[index] = updatedEjercicio;
      return {
        ...prev,
        ejercicios_interactivos: {
          ...prev.ejercicios_interactivos,
          ejercicios: newEjercicios
        }
      };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Título de los Ejercicios Interactivos
        </label>
        <input
          type="text"
          value={formData.ejercicios_interactivos?.titulo || ''}
          onChange={(e) => handleChange('titulo', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          placeholder="Título de la sección"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          value={formData.ejercicios_interactivos?.descripcion || ''}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          rows={3}
          placeholder="Descripción general de los ejercicios"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Ejercicios</h3>
          <div className="space-x-2">
            <button
              type="button"
              onClick={() => handleAddEjercicio('multiple_choice')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm"
            >
              <FaPlus className="inline mr-1" /> Opción Múltiple
            </button>
            <button
              type="button"
              onClick={() => handleAddEjercicio('fill_blank')}
              className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm"
            >
              <FaPlus className="inline mr-1" /> Completar
            </button>
            <button
              type="button"
              onClick={() => handleAddEjercicio('matching')}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm"
            >
              <FaPlus className="inline mr-1" /> Relacionar
            </button>
            <button
              type="button"
              onClick={() => handleAddEjercicio('ordering')}
              className="px-3 py-1.5 bg-yellow-600 text-white rounded-md text-sm"
            >
              <FaPlus className="inline mr-1" /> Ordenar
            </button>
          </div>
        </div>

        {(formData.ejercicios_interactivos?.ejercicios || []).map((ejercicio, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">
                {ejercicio.tipo === 'multiple_choice' && 'Opción Múltiple'}
                {ejercicio.tipo === 'fill_blank' && 'Completar'}
                {ejercicio.tipo === 'matching' && 'Relacionar'}
                {ejercicio.tipo === 'ordering' && 'Ordenar'}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveEjercicio(index)}
                className="text-red-600"
              >
                <FaTrash />
              </button>
            </div>

            {ejercicio.tipo === 'multiple_choice' && (
              <MultipleChoice
                ejercicio={ejercicio}
                onChange={(updatedEjercicio) => handleUpdateEjercicio(index, updatedEjercicio)}
              />
            )}
            {ejercicio.tipo === 'fill_blank' && (
              <FillInTheBlank
                ejercicio={ejercicio}
                onChange={(updatedEjercicio) => handleUpdateEjercicio(index, updatedEjercicio)}
              />
            )}
            {ejercicio.tipo === 'matching' && (
              <MatchingExercise
                ejercicio={ejercicio}
                onChange={(updatedEjercicio) => handleUpdateEjercicio(index, updatedEjercicio)}
              />
            )}
            {ejercicio.tipo === 'ordering' && (
              <OrderExercise
                ejercicio={ejercicio}
                onChange={(updatedEjercicio) => handleUpdateEjercicio(index, updatedEjercicio)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InteractiveExercises;