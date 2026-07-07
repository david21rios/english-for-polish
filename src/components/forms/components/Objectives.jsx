// src/components/forms/components/Objectives/index.jsx

import PropTypes from "prop-types";
import { FaPlus, FaTrash } from "react-icons/fa";

const Objectives = ({
  formData,
  setFormData
}) => {
  const objectives = Array.isArray(formData.objectives)
    ? formData.objectives
    : Array.isArray(formData.objetivos)
      ? formData.objetivos
      : [];

  const updateObjectives = (newObjectives) => {
    setFormData((prev) => ({
      ...prev,

      // Canonical field.
      objectives: newObjectives,

      // Legacy compatibility during migration.
      objetivos: newObjectives
    }));
  };

  const handleAddObjective = () => {
    updateObjectives([...objectives, ""]);
  };

  const handleObjectiveChange = (index, value) => {
    const newObjectives = [...objectives];

    newObjectives[index] = value;

    updateObjectives(newObjectives);
  };

  const handleRemoveObjective = (index) => {
    const newObjectives = objectives.filter(
      (_, objectiveIndex) => objectiveIndex !== index
    );

    updateObjectives(newObjectives);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-medium text-gray-900">
          Cele lekcji
        </h3>

        <button
          type="button"
          onClick={handleAddObjective}
          className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <FaPlus className="mr-2" />
          Dodaj cel
        </button>
      </div>

      {objectives.length > 0 ? (
        <div className="space-y-3">
          {objectives.map((objective, index) => (
            <div
              key={index}
              className="flex items-center gap-2"
            >
              <span className="text-gray-500 text-sm">
                {index + 1}.
              </span>

              <input
                type="text"
                value={objective}
                onChange={(event) =>
                  handleObjectiveChange(index, event.target.value)
                }
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Wpisz cel lekcji..."
              />

              <button
                type="button"
                onClick={() => handleRemoveObjective(index)}
                className="p-2 text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md"
                aria-label={`Usuń cel ${index + 1}`}
                title="Usuń cel"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm italic">
          Nie zdefiniowano jeszcze celów. Dodaj cele dla tej lekcji.
        </p>
      )}
    </div>
  );
};

Objectives.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired
};

export default Objectives;