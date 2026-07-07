// src/components/forms/components/BasicInfo.jsx

import PropTypes from "prop-types";

const BasicInfo = ({
  formData,
  setFormData,
  errors = {},
  isEditing = false
}) => {
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTitleChange = (event) => {
    const value = event.target.value;

    setFormData((prev) => ({
      ...prev,
      title: value,

      // Legacy compatibility during migration.
      titulo: value
    }));
  };

  const handleDescriptionChange = (event) => {
    const value = event.target.value;

    setFormData((prev) => ({
      ...prev,
      description: value,

      // Legacy compatibility during migration.
      descripcion: value
    }));
  };

  const titleError = errors.title || errors.titulo;

  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          ID lekcji

          {errors.id && (
            <span className="text-red-500 text-xs ml-2">
              {errors.id}
            </span>
          )}
        </label>

        <input
          type="text"
          name="id"
          value={formData.id || ""}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md shadow-sm ${
            errors.id
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
          }`}
          required
          disabled={isEditing}
        />

        {isEditing && (
          <p className="mt-1 text-xs text-gray-500">
            Identyfikatora lekcji nie można zmienić po jej utworzeniu.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tytuł

          {titleError && (
            <span className="text-red-500 text-xs ml-2">
              {titleError}
            </span>
          )}
        </label>

        <input
          type="text"
          name="title"
          value={formData.title || formData.titulo || ""}
          onChange={handleTitleChange}
          className={`mt-1 block w-full rounded-md shadow-sm ${
            titleError
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
          }`}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Opis
        </label>

        <textarea
          name="description"
          value={formData.description || formData.descripcion || ""}
          onChange={handleDescriptionChange}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="Opisz zawartość i główne cele lekcji..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Grupa wiekowa
        </label>

        <select
          name="ageGroup"
          value={formData.ageGroup || "all"}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="all">Wszyscy użytkownicy</option>
          <option value="kids_early">Dzieci w wieku 5–7 lat</option>
          <option value="kids">Dzieci w wieku 8–12 lat</option>
          <option value="teens">Młodzież w wieku 13–17 lat</option>
          <option value="adults">Dorośli w wieku 18 lat i starsi</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Status lekcji
        </label>

        <select
          name="status"
          value={formData.status || "draft"}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="draft">Szkic</option>
          <option value="published">Opublikowana</option>
        </select>

        <p className="mt-1 text-xs text-gray-500">
          Lekcje zapisane jako szkic nie są widoczne dla uczniów.
        </p>
      </div>
    </div>
  );
};

BasicInfo.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  errors: PropTypes.object,
  isEditing: PropTypes.bool
};

export default BasicInfo;