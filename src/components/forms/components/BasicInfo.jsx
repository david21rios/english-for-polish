import React from 'react';

const BasicInfo = ({ formData, setFormData, errors, isEditing }) => {

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-6">

      {/* ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          ID de la lección
          {errors.id && (
            <span className="text-red-500 text-xs ml-2">{errors.id}</span>
          )}
        </label>

        <input
          type="text"
          name="id"
          value={formData.id || ''}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md shadow-sm 
            ${errors.id
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
          required
          disabled={isEditing}
        />
      </div>

      {/* TÍTULO */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Título
          {errors.titulo && (
            <span className="text-red-500 text-xs ml-2">{errors.titulo}</span>
          )}
        </label>

        <input
          type="text"
          name="titulo"
          value={formData.titulo || ''}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md shadow-sm 
            ${errors.titulo
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
          required
        />
      </div>

      {/* DESCRIPCIÓN */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descripción
        </label>

        <textarea
          name="descripcion"
          value={formData.descripcion || ''}
          onChange={handleChange}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
            focus:border-primary-500 focus:ring-primary-500"
          placeholder="Describe el contenido y objetivos principales de la lección..."
        />
      </div>

      {/* GRUPO DE EDAD */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Grupo de edad
        </label>

        <select
          name="ageGroup"
          value={formData.ageGroup || 'all'}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
            focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="all">Todos los usuarios</option>
          <option value="kids_early">Niños de 5 a 7 años</option>
          <option value="kids">Niños de 8 a 12 años</option>
          <option value="teens">Jóvenes de 13 a 17 años</option>
          <option value="adults">Adultos de 18 años en adelante</option>
        </select>
      </div>

      {/* ESTADO */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Estado de la lección
        </label>

        <select
          name="status"
          value={formData.status || 'draft'}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
            focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="draft">Borrador</option>
          <option value="published">Publicada</option>
        </select>

        <p className="mt-1 text-xs text-gray-500">
          Las lecciones en borrador no serán visibles para los estudiantes.
        </p>
      </div>

    </div>
  );
};

export default BasicInfo;