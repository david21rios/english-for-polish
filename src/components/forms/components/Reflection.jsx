// src/components/forms/components/Reflection.jsx

import PropTypes from "prop-types";

const Reflection = ({ formData, setFormData }) => {
  const reflection = formData.finalReflection || formData.reflexion_final || "";

  const handleChange = (value) => {
    setFormData((prev) => ({
      ...prev,

      // Canonical model.
      finalReflection: value,

      // Legacy compatibility during migration.
      reflexion_final: value
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Refleksja końcowa
        </label>

        <textarea
          value={reflection}
          onChange={(event) => handleChange(event.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          rows={8}
          placeholder="Wpisz końcową refleksję lekcji..."
        />
      </div>

      <p className="text-sm text-gray-500">
        Refleksja końcowa powinna podsumować najważniejsze elementy lekcji oraz
        pokazać, jak łączą się one z celami nauki.
      </p>
    </div>
  );
};

Reflection.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired
};

export default Reflection;