// src/components/AdminTemas.jsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaGamepad,
  FaLayerGroup,
  FaPlus
} from "react-icons/fa";

import {
  createTheme,
  deleteTheme,
  getAllThemes,
  updateTheme
} from "../../services/auth/firestoreService";

import ThemeCard from "../topics/admin/AdminThemeCard";
import ThemeForm from "../topics/admin/AdminThemeForm";

import {
  normalizeThemeFormData,
  validateThemeForm
} from "../topics/admin/themeValidation";

const INITIAL_THEME = {
  icon: "",
  title: "",
  description: "",
  numero: ""
};

const AdminTemas = () => {
  const navigate = useNavigate();

  const [themes, setThemes] =
    useState([]);

  const [themeForm, setThemeForm] =
    useState(INITIAL_THEME);

  const [editingId, setEditingId] =
    useState(null);

  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [archivingId, setArchivingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage
  ] = useState("");

  const totalThemes = themes.length;

  const nextThemeNumber =
    useMemo(() => {
      const highestNumber =
        themes.reduce(
          (max, theme) =>
            Math.max(
              max,
              Number(theme.numero) || 0
            ),
          0
        );

      return highestNumber + 1;
    }, [themes]);

  const loadThemes =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getAllThemes();

        setThemes(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (loadError) {
        console.error(
          "Error loading topics:",
          loadError
        );

        setError(
          "Nie udało się załadować tematów."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  const closeForm = () => {
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

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const openEditForm = (theme) => {
    setThemeForm({
      icon: theme.icon || "",
      title: theme.title || "",
      description:
        theme.description || "",
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

  const handleInputChange = (
    event
  ) => {
    const {
      name,
      value
    } = event.target;

    setThemeForm((previous) => ({
      ...previous,
      [name]: value
    }));

    setError("");
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const validationError =
      validateThemeForm({
        themeForm,
        themes,
        editingId
      });

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const themeData =
        normalizeThemeFormData(
          themeForm
        );

      if (editingId) {
        await updateTheme(
          editingId,
          themeData
        );

        setSuccessMessage(
          "Temat został zaktualizowany."
        );
      } else {
        await createTheme(
          themeData
        );

        setSuccessMessage(
          "Temat został utworzony."
        );
      }

      setThemeForm(INITIAL_THEME);
      setEditingId(null);
      setIsFormOpen(false);

      await loadThemes();
    } catch (saveError) {
      console.error(
        "Error saving topic:",
        saveError
      );

      setError(
        saveError?.message ||
          "Nie udało się zapisać tematu."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOpenMissions = (
    theme
  ) => {
    if (!theme?.id) {
      setError(
        "Nie można otworzyć misji dla nieprawidłowego tematu."
      );

      return;
    }

    navigate(
      `/admin/missions?themeId=${encodeURIComponent(
        theme.id
      )}`
    );
  };

  const handleArchive = async (
    theme
  ) => {
    if (!theme?.id) {
      setError(
        "Nie można zarchiwizować nieprawidłowego tematu."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Czy na pewno chcesz zarchiwizować temat „${theme.title}”?\n\nTemat zostanie ukryty, ale jego misje i dane pozostaną zapisane.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setArchivingId(theme.id);
      setError("");
      setSuccessMessage("");

      await deleteTheme(theme.id);

      if (editingId === theme.id) {
        setThemeForm(
          INITIAL_THEME
        );

        setEditingId(null);
        setIsFormOpen(false);
      }

      setSuccessMessage(
        "Temat został zarchiwizowany."
      );

      await loadThemes();
    } catch (archiveError) {
      console.error(
        "Error archiving topic:",
        archiveError
      );

      setError(
        archiveError?.message ||
          "Nie udało się zarchiwizować tematu."
      );
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-5 md:py-8">
      <div className="container mx-auto max-w-7xl px-3 sm:px-4">
        <button
          type="button"
          onClick={() =>
            navigate("/admin")
          }
          className="mb-5 inline-flex items-center gap-2 font-medium text-gray-600 hover:text-primary-600"
        >
          <FaArrowLeft />
          Wróć do panelu administratora
        </button>

        <header className="mb-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-lg md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
                Tematy i misje
              </p>

              <h1 className="mt-2 text-3xl font-bold text-gray-900 md:text-4xl">
                Zarządzanie tematami
              </h1>

              <p className="mt-3 max-w-3xl leading-relaxed text-gray-600">
                Organizuj główne
                tematy widoczne dla
                uczniów i powiąż je z
                misjami konwersacyjnymi.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/admin/missions"
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                <FaGamepad />
                Wszystkie misje
              </button>

              <button
                type="button"
                onClick={
                  openCreateForm
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700"
              >
                <FaPlus />
                Utwórz temat
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
              <p className="text-xs font-semibold uppercase text-primary-600">
                Aktywne tematy
              </p>

              <p className="mt-1 text-2xl font-bold text-primary-700">
                {totalThemes}
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-xs font-semibold uppercase text-indigo-600">
                Moduł
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                Misje tematyczne
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <p className="text-xs font-semibold uppercase text-green-600">
                Następny numer
              </p>

              <p className="mt-1 text-2xl font-bold text-green-700">
                {nextThemeNumber}
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-green-700"
          >
            {successMessage}
          </div>
        )}

        {isFormOpen && (
          <ThemeForm
            themeForm={
              themeForm
            }
            themes={themes}
            editingId={
              editingId
            }
            saving={saving}
            onChange={
              handleInputChange
            }
            onSubmit={
              handleSubmit
            }
            onCancel={
              closeForm
            }
          />
        )}

        {loading ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-gray-600 shadow-sm">
            Ładowanie tematów...
          </div>
        ) : themes.length === 0 ? (
          <section className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm md:p-12">
            <FaLayerGroup className="mx-auto mb-4 text-4xl text-primary-600" />

            <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
              Brak aktywnych tematów
            </h2>

            <p className="mt-2 text-gray-600">
              Utwórz pierwszy temat,
              aby rozpocząć budowanie
              sekcji interaktywnej.
            </p>

            <button
              type="button"
              onClick={
                openCreateForm
              }
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700"
            >
              <FaPlus />
              Utwórz pierwszy temat
            </button>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {themes.map(
              (theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  archiving={
                    archivingId ===
                    theme.id
                  }
                  onEdit={
                    openEditForm
                  }
                  onOpenMissions={
                    handleOpenMissions
                  }
                  onArchive={
                    handleArchive
                  }
                />
              )
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminTemas;