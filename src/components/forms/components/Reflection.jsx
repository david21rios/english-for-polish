// components/Reflection/index.jsx
import React from 'react';

const Reflection = ({ formData, setFormData }) => {
  const handleChange = (value) => {
    setFormData(prev => ({
      ...prev,
      reflexion_final: value
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Reflexión Final
        </label>
        <textarea
          value={formData.reflexion_final || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          rows={8}
          placeholder="Escriba aquí la reflexión final de la lección..."
        />
      </div>
      <p className="text-sm text-gray-500">
        La reflexión final debe incluir los puntos más importantes aprendidos en la lección
        y cómo estos se relacionan con los objetivos planteados.
      </p>
    </div>
  );
};

export default Reflection;