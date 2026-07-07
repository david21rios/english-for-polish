// src/components/forms/components/Resources.jsx

import PropTypes from "prop-types";
import { FaPlus, FaTrash } from "react-icons/fa";

const normalizeResources = (resources = []) => {
  if (!Array.isArray(resources)) return [];

  return resources.map((item) => ({
    title: item.title || item.titulo || item.nombre || "",
    description: item.description || item.descripcion || "",
    type: item.type || item.tipo || "",
    audience: item.audience || item.audiencia || "",
    url: item.url || item.link || item.enlace || ""
  }));
};

const buildLegacyResources = (resources = []) =>
  resources.map((item) => ({
    titulo: item.title || "",
    descripcion: item.description || "",
    tipo: item.type || "",
    audiencia: item.audience || "",
    url: item.url || ""
  }));

const Resources = ({ formData, setFormData }) => {
  const resources = normalizeResources(
    formData.additionalResources || formData.recursos_adicionales || []
  );

  const updateResources = (updatedResources) => {
    const normalizedResources = normalizeResources(updatedResources);

    setFormData((prev) => ({
      ...prev,

      // Canonical model.
      additionalResources: normalizedResources,

      // Legacy compatibility during migration.
      recursos_adicionales: buildLegacyResources(normalizedResources)
    }));
  };

  const handleAddResource = () => {
    updateResources([
      ...resources,
      {
        title: "",
        description: "",
        type: "link",
        audience: formData.ageGroup || "all",
        url: ""
      }
    ]);
  };

  const handleResourceChange = (index, field, value) => {
    const newResources = [...resources];

    newResources[index] = {
      ...newResources[index],
      [field]: value
    };

    updateResources(newResources);
  };

  const handleRemoveResource = (index) => {
    updateResources(
      resources.filter((_, resourceIndex) => resourceIndex !== index)
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Dodatkowe zasoby
          </h3>

          <p className="text-sm text-gray-500">
            Materiały uzupełniające do wzmocnienia treści lekcji.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddResource}
          className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <FaPlus className="mr-2" />
          Dodaj zasób
        </button>
      </div>

      {resources.length > 0 ? (
        <div className="space-y-5">
          {resources.map((resource, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white"
            >
              <div className="flex justify-between items-start gap-3">
                <h4 className="font-semibold text-gray-900">
                  Zasób {index + 1}
                </h4>

                <button
                  type="button"
                  onClick={() => handleRemoveResource(index)}
                  className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Usuń zasób ${index + 1}`}
                  title="Usuń zasób"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tytuł
                  </label>

                  <input
                    type="text"
                    value={resource.title}
                    onChange={(event) =>
                      handleResourceChange(index, "title", event.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Nazwa zasobu..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Typ
                  </label>

                  <select
                    value={resource.type}
                    onChange={(event) =>
                      handleResourceChange(index, "type", event.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Wybierz typ</option>
                    <option value="video">Wideo</option>
                    <option value="document">Dokument</option>
                    <option value="link">Link</option>
                    <option value="audio">Audio</option>
                    <option value="image">Obraz</option>
                    <option value="activity">Aktywność</option>
                    <option value="offline">Offline / z przewodnikiem</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Odbiorcy
                  </label>

                  <select
                    value={resource.audience}
                    onChange={(event) =>
                      handleResourceChange(
                        index,
                        "audience",
                        event.target.value
                      )
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Wybierz odbiorców</option>
                    <option value="children">Dzieci</option>
                    <option value="teens">Młodzież</option>
                    <option value="adults">Dorośli</option>
                    <option value="all">Wszyscy</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    URL
                  </label>

                  <input
                    type="url"
                    value={resource.url}
                    onChange={(event) =>
                      handleResourceChange(index, "url", event.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="https://..."
                  />

                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Otwórz zasób ↗
                    </a>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Opis
                  </label>

                  <textarea
                    value={resource.description}
                    onChange={(event) =>
                      handleResourceChange(
                        index,
                        "description",
                        event.target.value
                      )
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    rows={3}
                    placeholder="Opis zasobu..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm italic">
          Nie zdefiniowano jeszcze dodatkowych zasobów.
        </p>
      )}
    </div>
  );
};

Resources.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired
};

export default Resources;