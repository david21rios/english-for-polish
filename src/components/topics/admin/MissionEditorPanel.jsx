// src/components/topics/admin/MissionEditorPanel.jsx

import {
  FaTimes
} from "react-icons/fa";

import MissionForm from "./MissionForm";

const MissionEditorPanel = ({
  editingMission = null,
  missions = [],
  saving = false,
  onSubmit,
  onCancel
}) => {
  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg">
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5 md:p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
            {editingMission
              ? "Edycja misji"
              : "Nowa misja"}
          </p>

          <h2 className="mt-1 text-2xl font-bold text-gray-900">
            {editingMission
              ? "Edytuj misję"
              : "Utwórz misję"}
          </h2>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          aria-label="Zamknij formularz"
        >
          <FaTimes />
        </button>
      </div>

      <div className="p-5 md:p-6">
        <MissionForm
          initialData={
            editingMission
          }
          missions={missions}
          editingMissionId={
            editingMission?.id ||
            null
          }
          saving={saving}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </div>
    </section>
  );
};

export default MissionEditorPanel;