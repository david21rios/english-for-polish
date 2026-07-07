// src/components/topics/MissionForm.jsx

import { useEffect, useState } from "react";
import {
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash
} from "react-icons/fa";

const INITIAL_FORM = {
  title: "",
  description: "",
  scenario: "",
  aiRole: "",
  aiInstructions: "",
  difficulty: "easy",
  level: "A1",
  ageGroup: "all",
  estimatedMinutes: 5,
  xpReward: 10,
  order: 1,
  status: "draft",
  missionType: "conversation",
  feedbackMode: "after_mission",
  correctionMode: "delayed",
  objectives: [
    {
      id: "objective_1",
      text: "",
      required: true
    }
  ],
  tags: ""
};

const MissionForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  saving = false
}) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initialData) {
      setFormData(INITIAL_FORM);
      return;
    }

    setFormData({
      ...INITIAL_FORM,
      ...initialData,
      objectives:
        initialData.objectives?.length > 0
          ? initialData.objectives
          : INITIAL_FORM.objectives,
      tags: Array.isArray(initialData.tags)
        ? initialData.tags.join(", ")
        : initialData.tags || ""
    });
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleObjectiveChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      objectives: prev.objectives.map((objective, currentIndex) =>
        currentIndex === index
          ? {
              ...objective,
              [field]: value
            }
          : objective
      )
    }));
  };

  const addObjective = () => {
    setFormData((prev) => ({
      ...prev,
      objectives: [
        ...prev.objectives,
        {
          id: `objective_${prev.objectives.length + 1}`,
          text: "",
          required: true
        }
      ]
    }));
  };

  const removeObjective = (index) => {
    setFormData((prev) => ({
      ...prev,
      objectives:
        prev.objectives.length === 1
          ? prev.objectives
          : prev.objectives.filter((_, currentIndex) => currentIndex !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      return "Tytuł misji jest wymagany.";
    }

    if (!formData.description.trim()) {
      return "Opis misji jest wymagany.";
    }

    if (!formData.scenario.trim()) {
      return "Scenariusz misji jest wymagany.";
    }

    if (!formData.aiRole.trim()) {
      return "Rola AI jest wymagana.";
    }

    const validObjectives = formData.objectives.filter((objective) =>
      objective.text.trim()
    );

    if (validObjectives.length === 0) {
      return "Dodaj co najmniej jeden cel.";
    }

    if (Number(formData.xpReward) <= 0) {
      return "Nagroda XP musi być większa niż 0.";
    }

    if (Number(formData.estimatedMinutes) <= 0) {
      return "Szacowany czas musi być większy niż 0.";
    }

    if (Number(formData.order) <= 0) {
      return "Kolejność musi być większa niż 0.";
    }

    return "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");

    const cleanData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      scenario: formData.scenario.trim(),
      aiRole: formData.aiRole.trim(),
      aiInstructions: formData.aiInstructions.trim(),
      xpReward: Number(formData.xpReward),
      estimatedMinutes: Number(formData.estimatedMinutes),
      order: Number(formData.order),
      objectives: formData.objectives
        .map((objective, index) => ({
          id: objective.id || `objective_${index + 1}`,
          text: objective.text.trim(),
          required: objective.required !== false
        }))
        .filter((objective) => objective.text),
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    };

    onSubmit(cleanData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6 space-y-5"
    >
      <div>
        <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
          Edytor misji
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-1">
          {initialData?.id ? "Edytuj misję" : "Utwórz misję"}
        </h2>

        <p className="text-gray-600 mt-2 text-sm">
          Zaprojektuj realistyczną misję konwersacyjną. AI powinno prowadzić
          rozmowę i przekazać informację zwrotną dopiero na końcu.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tytuł
          </label>

          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Np. Meeting your partner's parents"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rola AI
          </label>

          <input
            type="text"
            name="aiRole"
            value={formData.aiRole}
            onChange={handleChange}
            placeholder="Np. Mother of your partner"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Krótki opis
        </label>

        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          placeholder="Opisz, co student będzie ćwiczyć."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={saving}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Scenariusz
        </label>

        <textarea
          name="scenario"
          value={formData.scenario}
          onChange={handleChange}
          rows="4"
          placeholder="Np. You are visiting your partner's parents for the first time..."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={saving}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Instrukcje dla AI
        </label>

        <textarea
          name="aiInstructions"
          value={formData.aiInstructions}
          onChange={handleChange}
          rows="4"
          placeholder="Np. Do not correct during the conversation. Keep the role. Provide feedback only after mission completion."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={saving}
        />
      </div>

      <section className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-gray-900">
              Cele misji
            </h3>

            <p className="text-sm text-gray-600">
              AI będzie oceniać je w tle podczas rozmowy.
            </p>
          </div>

          <button
            type="button"
            onClick={addObjective}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            <FaPlus />
            Dodaj
          </button>
        </div>

        <div className="space-y-3">
          {formData.objectives.map((objective, index) => (
            <div
              key={objective.id || index}
              className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col md:flex-row gap-3"
            >
              <input
                type="text"
                value={objective.text}
                onChange={(event) =>
                  handleObjectiveChange(index, "text", event.target.value)
                }
                placeholder={`Cel ${index + 1}`}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={saving}
              />

              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={objective.required !== false}
                  onChange={(event) =>
                    handleObjectiveChange(
                      index,
                      "required",
                      event.target.checked
                    )
                  }
                  disabled={saving}
                />
                Wymagany
              </label>

              <button
                type="button"
                onClick={() => removeObjective(index)}
                disabled={saving || formData.objectives.length === 1}
                className="inline-flex items-center justify-center gap-2 text-red-600 hover:text-red-800 disabled:opacity-40"
                aria-label="Usuń cel"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Poziom
          </label>

          <select
            name="level"
            value={formData.level}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          >
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Trudność
          </label>

          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          >
            <option value="easy">Łatwa</option>
            <option value="medium">Średnia</option>
            <option value="hard">Trudna</option>
            <option value="adaptive">Adaptacyjna</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            XP
          </label>

          <input
            type="number"
            name="xpReward"
            min="1"
            value={formData.xpReward}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Minuty
          </label>

          <input
            type="number"
            name="estimatedMinutes"
            min="1"
            value={formData.estimatedMinutes}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Kolejność
          </label>

          <input
            type="number"
            name="order"
            min="1"
            value={formData.order}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Grupa wiekowa
          </label>

          <select
            name="ageGroup"
            value={formData.ageGroup}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          >
            <option value="all">Wszystkie grupy</option>
            <option value="children">Dzieci</option>
            <option value="teen">Nastolatki</option>
            <option value="adult">Dorośli</option>
            <option value="senior">Seniorzy</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Status
          </label>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          >
            <option value="draft">Szkic</option>
            <option value="published">Opublikowana</option>
            <option value="archived">Zarchiwizowana</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Tagi
        </label>

        <input
          type="text"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="family, introductions, conversation"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={saving}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50"
        >
          <FaSave />
          {saving ? "Zapisywanie..." : "Zapisz misję"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 disabled:opacity-50"
        >
          <FaTimes />
          Anuluj
        </button>
      </div>
    </form>
  );
};

export default MissionForm;