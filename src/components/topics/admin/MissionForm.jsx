// src/components/topics/admin/MissionForm.jsx

import {
  useEffect,
  useState
} from "react";

import {
  FaSave,
  FaTimes
} from "react-icons/fa";

import MissionAiFields from "./mission/MissionAiFields";
import MissionBasicFields from "./mission/MissionBasicFields";
import MissionObjectivesEditor from "./mission/MissionObjectivesEditor";
import MissionSettingsFields from "./mission/MissionSettingsFields";
import MissionTagsField from "./mission/MissionTagsField";

import {
  createEmptyObjective,
  hydrateMissionForm,
  normalizeMissionFormData
} from "./mission/missionFormData";

import {
  MISSION_FIELD_LIMITS
} from "./mission/missionFormConfig";

import {
  validateMissionForm
} from "./mission/missionFormValidation";

const MissionForm = ({
  initialData = null,
  missions = [],
  editingMissionId = null,
  onSubmit,
  onCancel,
  saving = false
}) => {
  const [
    formData,
    setFormData
  ] = useState(() =>
    hydrateMissionForm(initialData)
  );

  const [error, setError] =
    useState("");

  useEffect(() => {
    setFormData(
      hydrateMissionForm(initialData)
    );

    setError("");
  }, [initialData]);

  const clearError = () => {
    if (error) {
      setError("");
    }
  };

  const handleChange = (
    event
  ) => {
    const {
      name,
      value
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    clearError();
  };

  const handleObjectiveChange = (
    index,
    field,
    value
  ) => {
    setFormData((previous) => ({
      ...previous,

      objectives:
        previous.objectives.map(
          (
            objective,
            currentIndex
          ) =>
            currentIndex === index
              ? {
                  ...objective,
                  [field]: value
                }
              : objective
        )
    }));

    clearError();
  };

  const addObjective = () => {
    setFormData((previous) => {
      if (
        previous.objectives.length >=
        MISSION_FIELD_LIMITS
          .objectives.max
      ) {
        return previous;
      }

      return {
        ...previous,

        objectives: [
          ...previous.objectives,
          createEmptyObjective()
        ]
      };
    });

    clearError();
  };

  const removeObjective = (
    index
  ) => {
    setFormData((previous) => {
      if (
        previous.objectives.length <= 1
      ) {
        return previous;
      }

      return {
        ...previous,

        objectives:
          previous.objectives.filter(
            (
              _objective,
              currentIndex
            ) =>
              currentIndex !== index
          )
      };
    });

    clearError();
  };

  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const validationError =
      validateMissionForm({
        formData,
        missions,
        editingMissionId:
          editingMissionId ||
          initialData?.id ||
          null
      });

    if (validationError) {
      setError(validationError);

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      return;
    }

    setError("");

    const cleanData =
      normalizeMissionFormData(
        formData
      );

    onSubmit(cleanData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-6"
      noValidate
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
          Edytor misji
        </p>

        <h2 className="mt-1 text-2xl font-bold text-gray-900">
          {initialData?.id
            ? "Edytuj misję"
            : "Utwórz misję"}
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Zaprojektuj realistyczną misję
          konwersacyjną. AI powinno
          prowadzić rozmowę i przekazać
          informację zwrotną dopiero na
          końcu.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <MissionBasicFields
        formData={formData}
        saving={saving}
        onChange={handleChange}
      />

      <MissionAiFields
        formData={formData}
        saving={saving}
        onChange={handleChange}
      />

      <MissionObjectivesEditor
        objectives={
          formData.objectives
        }
        saving={saving}
        onAdd={addObjective}
        onChange={
          handleObjectiveChange
        }
        onRemove={
          removeObjective
        }
      />

      <MissionSettingsFields
        formData={formData}
        saving={saving}
        onChange={handleChange}
      />

      <MissionTagsField
        value={formData.tags}
        saving={saving}
        onChange={handleChange}
      />

      <div className="flex flex-col gap-3 pt-3 sm:flex-row">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaSave />

          {saving
            ? "Zapisywanie..."
            : initialData?.id
              ? "Zaktualizuj misję"
              : "Zapisz misję"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-200 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50"
        >
          <FaTimes />
          Anuluj
        </button>
      </div>
    </form>
  );
};

export default MissionForm;