// src/components/AdminTemas.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEdit,
  FaGamepad,
  FaLayerGroup,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash
} from "react-icons/fa";

import { iconOptions } from "../../utils/iconOptions";
import {
  createTheme,
  deleteTheme,
  getAllThemes,
  updateTheme
} from "../../services/firestoreService";

const INITIAL_THEME = {
  icon: "",
  title: "",
  description: "",
  numero: ""
};

const AdminTemas = () => {
  const navigate = useNavigate();

  const [themes, setThemes] = useState([]);
  const [themeForm, setThemeForm] = useState(INITIAL_THEME);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const totalThemes = themes.length;

  const nextThemeNumber = useMemo(() => {
    const highestNumber = themes.reduce(
      (max, theme) => Math.max(max, Number(theme.numero) || 0),
      0
    );

    return highestNumber + 1;
  }, [themes]);

  const loadThemes = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllThemes();
      setThemes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading topics:", error);
      setError("Nie udało się załadować tematów.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  const resetForm = () => {
    setThemeForm(INITIAL_THEME);
    setEditingId(null);
    setIsFormOpen(false);
    setError("");
  };

  const openCreateForm = () => {
    setThemeForm({
      ...INITIAL_THEME,
      numero: nextThemeNumber
    });
    setEditingId(null);
    setIsFormOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const openEditForm = (theme) => {
    setThemeForm({
      icon: theme.icon || "",
      title: theme.title || "",
      description: theme.description || "",
      numero: theme.numero || ""
    });

    setEditingId(theme.id);
    setIsFormOpen(true);
    setError("");
    setSuccessMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setThemeForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateTheme = () => {
    const numberValue = Number(themeForm.numero);

    if (!themeForm.title.trim()) {
      return "Tytuł tematu jest wymagany.";
    }

    if (!themeForm.icon) {
      return "Wybierz ikonę tematu.";
    }

    if (!themeForm.description.trim()) {
      return "Opis tematu jest wymagany.";
    }

    if (!Number.isInteger(numberValue) || numberValue <= 0) {
      return "Numer tematu musi być dodatnią liczbą całkowitą.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const validationError = validateTheme();

      if (validationError) {
        setError(validationError);
        return;
      }

      const themeData = {
        icon: themeForm.icon,
        title: themeForm.title.trim(),
        description: themeForm.description.trim(),
        numero: Number(themeForm.numero)
      };

      if (editingId) {
        await updateTheme(editingId, themeData);
        setSuccessMessage("Temat został zaktualizowany.");
      } else {
        await createTheme(themeData);
        setSuccessMessage("Temat został utworzony.");
      }

      resetForm();
      await loadThemes();
    } catch (error) {
      console.error("Error saving topic:", error);
      setError(error.message || "Nie udało się zapisać tematu.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (theme) => {
    const confirmDelete = window.confirm(
      `Czy na pewno chcesz usunąć temat „${theme.title}”?`
    );

    if (!confirmDelete) return;

    try {
      setError("");
      setSuccessMessage("");

      await deleteTheme(theme.id);

      setSuccessMessage("Temat został usunięty.");
      await loadThemes();
    } catch (error) {
      console.error("Error deleting topic:", error);
      setError(error.message || "Nie udało się usunąć tematu.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-5 md:py-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="mb-5 inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium"
        >
          <FaArrowLeft />
          Wróć do panelu administratora
        </button>

        <header className="bg-white rounded-3xl shadow-lg border border-gray-100 p-5 md:p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
                Tematy i misje
              </p>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
                Zarządzanie tematami
              </h1>

              <p className="text-gray-600 mt-3 max-w-3xl leading-relaxed">
                Organizuj główne tematy widoczne dla uczniów i powiąż je z
                misjami konwersacyjnymi.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate("/admin/missions")}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-semibold"
              >
                <FaGamepad />
                Misje
              </button>

              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-2xl font-semibold"
              >
                <FaPlus />
                Utwórz temat
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
              <p className="text-xs text-primary-600 font-semibold uppercase">
                Tematy
              </p>

              <p className="text-2xl font-bold text-primary-700 mt-1">
                {totalThemes}
              </p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
              <p className="text-xs text-indigo-600 font-semibold uppercase">
                Moduł
              </p>

              <p className="text-xl font-bold text-gray-900 mt-1">
                Misje tematyczne
              </p>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <p className="text-xs text-green-600 font-semibold uppercase">
                Następny numer
              </p>

              <p className="text-2xl font-bold text-green-700 mt-1">
                {nextThemeNumber}
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl">
            {successMessage}
          </div>
        )}

        {isFormOpen && (
          <section className="mb-8 bg-white rounded-3xl shadow-lg border border-gray-100 p-5 md:p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
                  {editingId ? "Edycja tematu" : "Nowy temat"}
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  {editingId ? "Edytuj temat" : "Utwórz temat"}
                </h2>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center disabled:opacity-50"
                aria-label="Zamknij formularz"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ikona tematu
                </label>

                <select
                  name="icon"
                  value={themeForm.icon}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={saving}
                >
                  <option value="">Wybierz ikonę...</option>

                  {iconOptions.map((option, index) => (
                    <option key={`${option.icon}_${index}`} value={option.icon}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Numer
                  </label>

                  <input
                    type="number"
                    name="numero"
                    min="1"
                    value={themeForm.numero}
                    onChange={handleInputChange}
                    placeholder="Np. 1"
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={saving}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tytuł
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={themeForm.title}
                    onChange={handleInputChange}
                    placeholder="Tytuł tematu"
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={saving}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Opis
                </label>

                <textarea
                  name="description"
                  value={themeForm.description}
                  onChange={handleInputChange}
                  placeholder="Opis tematu"
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={saving}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-2xl hover:bg-primary-700 font-semibold disabled:opacity-50"
                >
                  <FaSave />
                  {saving
                    ? "Zapisywanie..."
                    : editingId
                    ? "Zaktualizuj temat"
                    : "Zapisz temat"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-2xl hover:bg-gray-200 font-semibold disabled:opacity-50"
                >
                  <FaTimes />
                  Anuluj
                </button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center text-gray-600">
            Ładowanie tematów...
          </div>
        ) : themes.length === 0 ? (
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
            <FaLayerGroup className="text-primary-600 text-4xl mx-auto mb-4" />

            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Brak utworzonych tematów
            </h2>

            <p className="text-gray-600 mt-2">
              Utwórz pierwszy temat, aby rozpocząć budowanie sekcji
              interaktywnej.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className="mt-5 inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-2xl font-semibold"
            >
              <FaPlus />
              Utwórz pierwszy temat
            </button>
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {themes.map((theme) => (
              <article
                key={theme.id}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 text-3xl flex items-center justify-center shrink-0">
                    {theme.icon || "📚"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-primary-600 font-semibold uppercase tracking-wide">
                      Temat #{theme.numero || "N/A"}
                    </p>

                    <h3 className="font-bold text-xl text-gray-900 mt-1 break-words">
                      {theme.title || "Temat bez tytułu"}
                    </h3>

                    <p className="text-gray-600 text-sm mt-2 break-words leading-relaxed">
                      {theme.description || "Brak opisu."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => openEditForm(theme)}
                    className="inline-flex items-center justify-center gap-2 bg-blue-50 text-blue-700 px-3 py-3 rounded-2xl font-semibold hover:bg-blue-100"
                  >
                    <FaEdit />
                    Edytuj
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/admin/missions")}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-3 rounded-2xl font-semibold hover:bg-indigo-100"
                  >
                    <FaGamepad />
                    Misje
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(theme)}
                    className="inline-flex items-center justify-center gap-2 bg-red-50 text-red-700 px-3 py-3 rounded-2xl font-semibold hover:bg-red-100"
                  >
                    <FaTrash />
                    Usuń
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminTemas;