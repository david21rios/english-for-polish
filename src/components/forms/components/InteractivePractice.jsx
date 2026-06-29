// components/forms/components/InteractivePractice.jsx
import React from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';
import MultipleChoise from './interactiveExercises/MultipleChoice';
import FillInBlank from './interactiveExercises/FillInTheBlanck';
import OrderExercise from './interactiveExercises/OrderExercise';
import MatchingExercise from './interactiveExercises/MatchingExercise';

const InteractivePractice = ({ formData, setFormData }) => {
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      practica_interactiva: {
        ...prev.practica_interactiva,
        [field]: value
      }
    }));
  };

  const handleAddEjercicio = (tipo) => {
    const nuevoEjercicio = {
      tipo,
      pregunta: '',
      instrucciones: '',
      ...(tipo === 'seleccion_multiple' && {
        opciones: [],
        respuesta_correcta: ''
      }),
      ...(tipo === 'completar' && {
        texto: '',
        palabras: [],
        respuestas: {}
      }),
      ...(tipo === 'ordenar' && {
        elementos: [],
        orden_correcto: []
      }),
      ...(tipo === "relacionar" && {
        pares_izquierda: [],
        pares_derecha: [],
        respuestas_correctas: {}
      })
    };

    setFormData(prev => ({
      ...prev,
      practica_interactiva: {
        ...prev.practica_interactiva,
        ejercicios: [...(prev.practica_interactiva?.ejercicios || []), nuevoEjercicio]
      }
    }));
  };

  const handleEjercicioChange = (index, field, value) => {
    setFormData(prev => {
      const newEjercicios = [...prev.practica_interactiva.ejercicios];
      newEjercicios[index] = { ...newEjercicios[index], [field]: value };
      return {
        ...prev,
        practica_interactiva: {
          ...prev.practica_interactiva,
          ejercicios: newEjercicios
        }
      };
    });
  };

  const handleUpdateEjercicio = (index, updatedEjercicio) => {
    setFormData(prev => {
      const newEjercicios = [...prev.practica_interactiva.ejercicios];
      newEjercicios[index] = updatedEjercicio;
      return {
        ...prev,
        practica_interactiva: {
          ...prev.practica_interactiva,
          ejercicios: newEjercicios
        }
      };
    });
  };

  const handleRemoveEjercicio = (index) => {
    setFormData(prev => ({
      ...prev,
      practica_interactiva: {
        ...prev.practica_interactiva,
        ejercicios: prev.practica_interactiva.ejercicios.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Título de la práctica
        </label>
        <input
          type="text"
          value={formData.practica_interactiva?.titulo || ''}
          onChange={(e) => handleChange('titulo', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          placeholder="Título de la práctica interactiva"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          value={formData.practica_interactiva?.descripcion || ''}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          rows={4}
          placeholder="Descripción de la práctica interactiva"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Ejercicios</h3>
          <div className="space-x-2">
            <button
              type="button"
              onClick={() => handleAddEjercicio('seleccion_multiple')}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
            >
              <FaPlus className="inline mr-1" /> Selección Múltiple
            </button>
            <button
              type="button"
              onClick={() => handleAddEjercicio('completar')}
              className="px-3 py-1 bg-green-600 text-white rounded-md text-sm"
            >
              <FaPlus className="inline mr-1" /> Completar
            </button>
            <button
              type="button"
              onClick={() => handleAddEjercicio('ordenar')}
              className="px-3 py-1 bg-yellow-600 text-white rounded-md text-sm"
            >
              <FaPlus className="inline mr-1" /> Ordenar
            </button>
            <button
              type="button"
              onClick={() => handleAddEjercicio('relacionar')}
              className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm"
            >
              <FaPlus className="inline mr-1" /> Relacionar
            </button>
          </div>
        </div>

        {(formData.practica_interactiva?.ejercicios || []).map((ejercicio, index) => (
          <div key={index} className="border p-4 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">
                {ejercicio.tipo === 'seleccion_multiple' && 'Selección Múltiple'}
                {ejercicio.tipo === 'completar' && 'Completar'}
                {ejercicio.tipo === 'ordenar' && 'Ordenar'}
                {ejercicio.tipo === 'relacionar' && 'Relacionar'}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveEjercicio(index)}
                className="text-red-600"
              >
                <FaTrash />
              </button>
            </div>

            <input
              type="text"
              value={ejercicio.pregunta || ''}
              onChange={(e) => handleEjercicioChange(index, 'pregunta', e.target.value)}
              className="w-full rounded-md border-gray-300"
              placeholder="Pregunta o instrucción"
            />

            {ejercicio.tipo === 'seleccion_multiple' && (
              <MultipleChoise
                ejercicio={ejercicio}
                onChange={(updatedEjercicio) => handleUpdateEjercicio(index, updatedEjercicio)}
              />
            )}

            {ejercicio.tipo === 'completar' && (
              <FillInBlank
                ejercicio={ejercicio}
                onChange={(updatedEjercicio) => handleUpdateEjercicio(index, updatedEjercicio)}
              />
            )}

            {ejercicio.tipo === 'ordenar' && (
              <OrderExercise
                ejercicio={ejercicio}
                onChange={(updatedEjercicio) => handleUpdateEjercicio(index, updatedEjercicio)}
              />
            )}

            {ejercicio.tipo === 'relacionar' && (
              <MatchingExercise
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

export default InteractivePractice;