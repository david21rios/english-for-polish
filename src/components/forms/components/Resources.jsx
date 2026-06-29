// src/components/forms/components/Resources.jsx

import React from "react";
import { FaTrash, FaPlus } from "react-icons/fa";

const normalizeResources = (resources = []) => {
  if (!Array.isArray(resources)) return [];

  return resources.map((item) => ({
    titulo: item.titulo || item.nombre || item.title || "",
    descripcion: item.descripcion || item.description || "",
    tipo: item.tipo || item.type || "",
    audiencia: item.audiencia || item.audience || "",
    url: item.url || item.enlace || item.link || ""
  }));
};

const Resources = ({ formData, setFormData }) => {
  const recursos = normalizeResources(formData.recursos_adicionales || []);

  const updateResources = (updatedResources) => {
    setFormData((prev) => ({
      ...prev,
      recursos_adicionales: updatedResources
    }));
  };

  const handleAddResource = () => {
    updateResources([
      ...recursos,
      {
        titulo: "",
        descripcion: "",
        tipo: "enlace",
        audiencia: formData.ageGroup || "all",
        url: ""
      }
    ]);
  };

  const handleResourceChange = (index, field, value) => {
    const newRecursos = [...recursos];

    newRecursos[index] = {
      ...newRecursos[index],
      [field]: value
    };

    updateResources(newRecursos);
  };

  const handleRemoveResource = (index) => {
    updateResources(recursos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Recursos adicionales
          </h3>
          <p className="text-sm text-gray-500">
            Material complementario para reforzar la lección.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddResource}
          className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <FaPlus className="mr-2" />
          Añadir recurso
        </button>
      </div>

      {recursos.length > 0 ? (
        <div className="space-y-5">
          {recursos.map((recurso, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white"
            >
              <div className="flex justify-between items-start gap-3">
                <h4 className="font-semibold text-gray-900">
                  Recurso {index + 1}
                </h4>

                <button
                  type="button"
                  onClick={() => handleRemoveResource(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Título
                  </label>
                  <input
                    type="text"
                    value={recurso.titulo}
                    onChange={(e) =>
                      handleResourceChange(index, "titulo", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300"
                    placeholder="Nombre del recurso"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tipo
                  </label>
                  <select
                    value={recurso.tipo}
                    onChange={(e) =>
                      handleResourceChange(index, "tipo", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300"
                  >
                    <option value="">Seleccione un tipo</option>
                    <option value="video">Video</option>
                    <option value="documento">Documento</option>
                    <option value="enlace">Enlace</option>
                    <option value="audio">Audio</option>
                    <option value="imagen">Imagen</option>
                    <option value="actividad">Actividad</option>
                    <option value="offline">Offline / guiado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Audiencia
                  </label>
                  <select
                    value={recurso.audiencia}
                    onChange={(e) =>
                      handleResourceChange(index, "audiencia", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300"
                  >
                    <option value="">Seleccione audiencia</option>
                    <option value="children">Niños</option>
                    <option value="teens">Adolescentes</option>
                    <option value="adults">Adultos</option>
                    <option value="all">Todos</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    URL
                  </label>
                  <input
                    type="url"
                    value={recurso.url}
                    onChange={(e) =>
                      handleResourceChange(index, "url", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300"
                    placeholder="https://..."
                  />

                  {recurso.url && (
                    <a
                      href={recurso.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Abrir recurso ↗
                    </a>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    value={recurso.descripcion}
                    onChange={(e) =>
                      handleResourceChange(index, "descripcion", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300"
                    rows={3}
                    placeholder="Descripción del recurso"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm italic">
          No hay recursos adicionales definidos.
        </p>
      )}
    </div>
  );
};

export default Resources;