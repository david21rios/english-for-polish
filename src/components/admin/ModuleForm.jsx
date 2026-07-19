// src/components/admin/ModuleForm.jsx

import { useEffect, useState } from "react";
import { FaSave, FaTimes } from "react-icons/fa";

import { getNextModuleOrder } from "../../services/courses/moduleService";

const STATUS_OPTIONS = [
  { value: "published", label: "Opublikowany" },
  { value: "draft", label: "Wersja robocza" }
];

const COLOR_OPTIONS = [
  { value: "primary", label: "Główny" },
  { value: "green", label: "Zielony" },
  { value: "blue", label: "Niebieski" },
  { value: "purple", label: "Fioletowy" },
  { value: "yellow", label: "Żółty" },
  { value: "red", label: "Czerwony" }
];

const ICON_OPTIONS = [
  { value: "📚", label: "Książki" },
  { value: "💬", label: "Rozmowa" },
  { value: "🧠", label: "Gramatyka" },
  { value: "🎧", label: "Słuchanie" },
  { value: "✍️", label: "Pisanie" },
  { value: "🗣️", label: "Mówienie" },
  { value: "🧩", label: "Ćwiczenia" },
  { value: "🌍", label: "Kultura" },
  { value: "🎯", label: "Cele" },
  { value: "🚀", label: "Postęp" }
];

const INITIAL_FORM = {
  title: "",
  description: "",
  order: 1,
  status: "published",
  icon: "📚",
  color: "primary"
};

const ModuleForm = ({
  levelId = "A1",
  initialData = null,
  onSubmit,
  onCancel,
  isSaving = false
}) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    const prepareForm = async () => {
      try {
        setError("");

        if (initialData) {
          setFormData({
            title: initialData.title || "",
            description: initialData.description || "",
            order: Number(initialData.order) || 1,
            status: initialData.status || "published",
            icon: initialData.icon || "📚",
            color: initialData.color || "primary",
            moduleId: initialData.moduleId || initialData.id || ""
          });

          return;
        }

        const nextOrder = await getNextModuleOrder(levelId);

        setFormData({
          ...INITIAL_FORM,
          order: nextOrder
        });
      } catch (error) {
        console.error("Error preparing module form:", error);
        setError("Nie udało się przygotować formularza modułu.");
      }
    };

    prepareForm();
  }, [initialData, levelId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "order" ? Number(value) : value
    }));
  };

  const validateForm = () => {
    if (!levelId) return "Poziom jest wymagany.";
    if (!formData.title.trim()) return "Tytuł modułu jest wymagany.";
    if (Number(formData.order) < 1) return "Kolejność musi być większa niż zero.";

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");

    await onSubmit?.({
      ...formData,
      levelId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      order: Number(formData.order) || 1,
      status: formData.status || "draft",
      icon: formData.icon || "📚",
      color: formData.color || "primary"
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <header className="bg-primary-600 text-white px-5 md:px-6 py-5 flex items-center justify-between shrink-0">
        <div>
          <p className="text-primary-100 text-xs md:text-sm font-semibold uppercase tracking-wide">
            Moduły kursu · Poziom {levelId}
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-1">
            {initialData ? "Edytuj moduł" : "Utwórz moduł"}
          </h2>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center disabled:opacity-50"
          aria-label="Zamknij formularz"
        >
          <FaTimes />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5 overflow-y-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Poziom
            </label>

            <input
              type="text"
              value={levelId}
              disabled
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 bg-gray-100 text-gray-700"
            />

            <p className="text-xs text-gray-500 mt-1">
              Poziom jest wybierany w panelu zarządzania modułami.
            </p>
          </div>

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
              disabled={isSaving}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tytuł modułu
          </label>

          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            disabled={isSaving}
            placeholder="Np. Greetings and Introductions"
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Opis
          </label>

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={isSaving}
            rows="4"
            placeholder="Krótki opis tego, czego uczeń nauczy się w tym module."
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ikona
            </label>

            <select
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              disabled={isSaving}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {ICON_OPTIONS.map((icon) => (
                <option key={icon.value} value={icon.value}>
                  {icon.value} {icon.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kolor
            </label>

            <select
              name="color"
              value={formData.color}
              onChange={handleChange}
              disabled={isSaving}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {COLOR_OPTIONS.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
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
              disabled={isSaving}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-2xl p-4 text-sm">
          Ten moduł grupuje lekcje w ścieżce{" "}
          <strong>levels/{levelId}/modules</strong>. Lekcje ręczne i lekcje AI
          będą przypisywane do wybranego modułu.
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3 sticky bottom-0 bg-white pb-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            Anuluj
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            <FaSave />
            {isSaving
              ? "Zapisywanie..."
              : initialData
              ? "Zaktualizuj moduł"
              : "Utwórz moduł"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModuleForm;