// src/components/admin/AdminModules.jsx

import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaBookOpen,
  FaEdit,
  FaLayerGroup,
  FaPlus,
  FaSearch,
  FaTrash
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import ModuleForm from "./ModuleForm";

import {
  createModule,
  deleteModule,
  getModulesByLevel,
  refreshModuleLessonCount,
  updateModule
} from "../../services/moduleService";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const STATUS_LABELS = {
  draft: "Wersja robocza",
  published: "Opublikowany"
};

const getStatusLabel = (status) => {
  return STATUS_LABELS[status] || status || "Nieznany";
};

const getStatusClass = (status) => {
  return status === "published"
    ? "bg-green-100 text-green-700"
    : "bg-gray-100 text-gray-700";
};

const getColorClass = (color) => {
  const colors = {
    primary: "bg-primary-50 text-primary-700 border-primary-100",
    green: "bg-green-50 text-green-700 border-green-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-100",
    red: "bg-red-50 text-red-700 border-red-100"
  };

  return colors[color] || colors.primary;
};

const AdminModules = () => {
  const navigate = useNavigate();

  const [levelId, setLevelId] = useState("A1");
  const [modules, setModules] = useState([]);
  const [searchText, setSearchText] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingId, setRefreshingId] = useState(null);
  const [error, setError] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);

  const loadModules = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getModulesByLevel(levelId, {
        includeDrafts: true
      });

      setModules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading modules:", error);

      setError(
        error.message ||
          "Nie udało się załadować modułów."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  const filteredModules = useMemo(() => {
    const value = searchText.trim().toLowerCase();

    if (!value) return modules;

    return modules.filter((module) => {
      return (
        String(module.title || "")
          .toLowerCase()
          .includes(value) ||
        String(module.description || "")
          .toLowerCase()
          .includes(value) ||
        String(module.moduleId || module.id || "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [modules, searchText]);

  const handleCreate = () => {
    setEditingModule(null);
    setIsFormOpen(true);
  };

  const handleEdit = (module) => {
    setEditingModule(module);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingModule(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      setError("");

      if (editingModule) {
        await updateModule({
          ...formData,
          levelId,
          moduleId: editingModule.moduleId || editingModule.id
        });
      } else {
        await createModule({
          ...formData,
          levelId
        });
      }

      await loadModules();
      handleCloseForm();
    } catch (error) {
      console.error("Error saving module:", error);

      setError(
        error.message ||
          "Nie udało się zapisać modułu."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (module) => {
    const lessonCount = Number(module.lessonCount) || 0;

    if (lessonCount > 0) {
      window.alert(
        "Ten moduł zawiera przypisane lekcje. Przenieś lub usuń lekcje przed usunięciem modułu."
      );

      return;
    }

    const moduleTitle = module.title || "Bez nazwy";

    const confirmDelete = window.confirm(
      `Czy na pewno chcesz usunąć moduł „${moduleTitle}”?`
    );

    if (!confirmDelete) return;

    try {
      setError("");

      await deleteModule(
        levelId,
        module.moduleId || module.id
      );

      await loadModules();
    } catch (error) {
      console.error("Error deleting module:", error);

      setError(
        error.message ||
          "Nie udało się usunąć modułu."
      );
    }
  };

  const handleRefreshLessonCount = async (module) => {
    const moduleId = module.moduleId || module.id;

    if (!moduleId) {
      setError(
        "Nie można odświeżyć liczby lekcji: brak identyfikatora modułu."
      );

      return;
    }

    try {
      setError("");
      setRefreshingId(moduleId);

      await refreshModuleLessonCount(
        levelId,
        moduleId
      );

      await loadModules();
    } catch (error) {
      console.error(
        "Error refreshing lesson count:",
        error
      );

      setError(
        error.message ||
          "Nie udało się odświeżyć liczby lekcji."
      );
    } finally {
      setRefreshingId(null);
    }
  };

  const totalModules = modules.length;

  const publishedModules = modules.filter(
    (module) => module.status === "published"
  ).length;

  const totalLessons = modules.reduce(
    (accumulator, module) =>
      accumulator + (Number(module.lessonCount) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-5 md:py-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="mb-5 inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium"
        >
          <FaArrowLeft />
          Powrót do panelu administratora
        </button>

        <header className="bg-white rounded-3xl shadow-lg border border-gray-100 p-5 md:p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
                Struktura akademicka
              </p>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
                Moduły kursu
              </h1>

              <p className="text-gray-600 mt-3 max-w-3xl leading-relaxed">
                Organizuj lekcje języka angielskiego dla
                polskich uczniów według poziomu CEFR i
                modułu.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-2xl font-semibold"
            >
              <FaPlus />
              Nowy moduł
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
              <p className="text-xs text-primary-600 font-semibold uppercase">
                Język nauki
              </p>

              <p className="text-xl font-bold text-gray-900 mt-1">
                Angielski
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-xs text-blue-600 font-semibold uppercase">
                Język pomocniczy
              </p>

              <p className="text-xl font-bold text-gray-900 mt-1">
                Polski
              </p>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <p className="text-xs text-green-600 font-semibold uppercase">
                Poziom CEFR
              </p>

              <p className="text-xl font-bold text-gray-900 mt-1">
                {levelId}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
              <FaLayerGroup className="text-primary-600 mx-auto mb-2" />

              <p className="text-2xl font-bold text-primary-700">
                {totalModules}
              </p>

              <p className="text-xs text-gray-600">
                Moduły
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
              <FaBookOpen className="text-green-600 mx-auto mb-2" />

              <p className="text-2xl font-bold text-green-700">
                {publishedModules}
              </p>

              <p className="text-xs text-gray-600">
                Opublikowane
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
              <FaBookOpen className="text-blue-600 mx-auto mb-2" />

              <p className="text-2xl font-bold text-blue-700">
                {totalLessons}
              </p>

              <p className="text-xs text-gray-600">
                Lekcje
              </p>
            </div>
          </div>
        </header>

        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-5 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Poziom
              </label>

              <select
                value={levelId}
                onChange={(event) => {
                  setLevelId(event.target.value);
                  setSearchText("");
                  setEditingModule(null);
                  setIsFormOpen(false);
                }}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {CEFR_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Szukaj
              </label>

              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  value={searchText}
                  onChange={(event) =>
                    setSearchText(event.target.value)
                  }
                  placeholder="Szukaj modułu..."
                  className="w-full border border-gray-300 rounded-2xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center text-gray-600">
            Ładowanie modułów...
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
            <FaLayerGroup className="text-primary-600 text-4xl mx-auto mb-4" />

            <h2 className="text-xl font-bold text-gray-900">
              Nie znaleziono modułów
            </h2>

            <p className="text-gray-600 mt-2">
              Utwórz pierwszy moduł dla poziomu {levelId}.
            </p>

            <button
              type="button"
              onClick={handleCreate}
              className="mt-5 inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-2xl font-semibold"
            >
              <FaPlus />
              Utwórz moduł
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredModules.map((module) => {
              const moduleId =
                module.moduleId || module.id;

              const moduleOrder =
                Number(module.order) || 0;

              const lessonCount =
                Number(module.lessonCount) || 0;

              return (
                <article
                  key={moduleId}
                  className={`rounded-3xl border p-5 shadow-sm hover:shadow-md transition-all ${getColorClass(
                    module.color
                  )}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center text-2xl shrink-0">
                          {module.icon || "📚"}
                        </span>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                            Poziom{" "}
                            {module.levelId || levelId}
                            {" · "}
                            Kolejność {moduleOrder}
                          </p>

                          <h2 className="text-xl font-bold text-gray-900 break-words">
                            {module.title ||
                              "Moduł bez nazwy"}
                          </h2>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${getStatusClass(
                        module.status
                      )}`}
                    >
                      {getStatusLabel(module.status)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mt-4 leading-relaxed break-words min-h-[48px]">
                    {module.description ||
                      "Brak dostępnego opisu."}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="inline-flex items-center gap-2 bg-white/70 text-gray-700 px-3 py-2 rounded-xl text-sm font-semibold">
                      <FaBookOpen />
                      {lessonCount} lekcji
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleRefreshLessonCount(module)
                      }
                      disabled={refreshingId === moduleId}
                      className="inline-flex items-center gap-2 bg-white/70 hover:bg-white text-gray-700 px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                      {refreshingId === moduleId
                        ? "Odświeżanie..."
                        : "Odśwież liczbę"}
                    </button>
                  </div>

                  <div className="flex gap-2 mt-5">
                    <button
                      type="button"
                      onClick={() => handleEdit(module)}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-blue-700 px-4 py-3 rounded-2xl font-semibold border border-white/70"
                    >
                      <FaEdit />
                      Edytuj
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(module)}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-700 px-4 py-3 rounded-2xl font-semibold border border-white/70"
                    >
                      <FaTrash />
                      Usuń
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {isFormOpen && (
          <div className="fixed inset-0 z-[100] bg-black/50 overflow-y-auto px-3 sm:px-4 py-6">
            <div className="min-h-full flex items-center justify-center">
              <ModuleForm
                levelId={levelId}
                initialData={editingModule}
                onSubmit={handleSubmit}
                onCancel={handleCloseForm}
                isSaving={saving}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModules;