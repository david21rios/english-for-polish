// src/components/forms/components/Objectives/index.jsx
import React from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';

const Objectives = ({ formData, setFormData }) => {
  const handleAddObjective = () => {
    setFormData(prev => ({
      ...prev,
      objetivos: [...prev.objetivos, '']
    }));
  };

  const handleObjectiveChange = (index, value) => {
    setFormData(prev => {
      const newObjetivos = [...prev.objetivos];
      newObjetivos[index] = value;
      return {
        ...prev,
        objetivos: newObjetivos
      };
    });
  };

  const handleRemoveObjective = (index) => {
    setFormData(prev => ({
      ...prev,
      objetivos: prev.objetivos.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Objetivos de la lección</h3>
        <button
          type="button"
          onClick={handleAddObjective}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <FaPlus className="mr-2" /> Añadir objetivo
        </button>
      </div>

      <div className="space-y-3">
        {formData.objetivos.map((objetivo, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">{index + 1}.</span>
            <input
              type="text"
              value={objetivo}
              onChange={(e) => handleObjectiveChange(index, e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Escriba el objetivo..."
            />
            <button
              type="button"
              onClick={() => handleRemoveObjective(index)}
              className="p-2 text-red-600 hover:text-red-800 focus:outline-none"
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>

      {formData.objetivos.length === 0 && (
        <p className="text-gray-500 text-sm italic">
          No hay objetivos definidos. Añade algunos objetivos para la lección.
        </p>
      )}
    </div>
  );
};

export default Objectives;