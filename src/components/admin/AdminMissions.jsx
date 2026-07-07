// src/components/admin/AdminMissions.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCopy,
  FaEdit,
  FaGamepad,
  FaLayerGroup,
  FaPlus,
  FaSpinner,
  FaTimes,
  FaTrash
} from "react-icons/fa";

import MissionForm from "../topics/MissionForm";
import {
  createMission,
  deleteMission,
  duplicateMission,
  getAllThemes,
  getMissionsByTheme,
  updateMission
} from "../../services/firestoreService";

const STATUS_LABELS = {
  draft: "Szkic",
  published: "Opublikowana",
  archived: "Zarchiwizowana"
};

const DIFFICULTY_LABELS = {
  easy: "Łatwa",
  medium: "Średnia",
  hard: "Trudna",
  adaptive: "Adaptacyjna"
};

const AdminMissions = () => {
  const navigate = useNavigate();

  const [themes, setThemes] = useState([]);
  const [activeTheme, setActiveTheme] = useState("");
  const [missions, setMissions] = useState([]);

  const [editingMission, setEditingMission] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [loadingThemes, setLoadingThemes] = useState(true);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeThemeData = useMemo(
    () => themes.find((theme) => theme.id === activeTheme),
    [themes, activeTheme]
  );

  const totalMissions = missions.length;
  const publishedMissions = missions.filter(
    (mission) => mission.status === "published"
  ).length;
  const draftMissions = missions.filter(
    (mission) => mission.status !== "published"
  ).length;

  const fetchThemes = useCallback(async () => {
    try {
      setLoadingThemes(true);
      setError("");

      const themesData = await getAllThemes();

      setThemes(Array.isArray(themesData) ? themesData : []);

      if (themesData.length > 0) {
        setActiveTheme((previousTheme) => previousTheme || themesData[0].id);
      }
    } catch (error) {
      console.error("Error loading themes:", error);
      setError("Nie udało się załadować tematów.");
    } finally {
      setLoadingThemes(false);
    }
  }, []);

  const fetchMissions = useCallback(async () => {
    if (!activeTheme) {
      setMissions([]);
      return;
    }

    try {
      setLoadingMissions(true);
      setError("");

      const data = await getMissionsByTheme(activeTheme, {
        includeDrafts: true
      });

      setMissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading missions:", error);
      setError("Nie udało się załadować misji.");
      setMissions([]);
    } finally {
      setLoadingMissions(false);
    }
  }, [activeTheme]);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const closeForm = () => {
    setEditingMission(null);
    setIsFormOpen(false);
    setError("");
  };

  const handleThemeChange = (themeId) => {
    setActiveTheme(themeId);
    setEditingMission(null);
    setIsFormOpen(false);
    setError("");
    setSuccessMessage("");
  };

  const openCreateForm = () => {
    if (!activeTheme) {
      setError("Najpierw wybierz temat.");
      return;
    }

    setEditingMission(null);
    setIsFormOpen(true);
    setError("");
    setSuccessMessage("");
  };

  const openEditForm = (mission) => {
    setEditingMission(mission);
    setIsFormOpen(true);
    setError("");
    setSuccessMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleSubmitMission = async (missionData) => {
    if (!activeTheme) {
      setError("Najpierw wybierz temat.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      if (editingMission?.id) {
        await updateMission(activeTheme, editingMission.id, missionData);
        setSuccessMessage("Misja została zaktualizowana.");
      } else {
        await createMission(activeTheme, missionData);
        setSuccessMessage("Misja została utworzona.");
      }

      closeForm();
      await fetchMissions();
    } catch (error) {
      console.error("Error saving mission:", error);
      setError(`Nie udało się zapisać misji: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMission = async (mission) => {
    const confirmDelete = window.confirm(
      `Czy na pewno chcesz usunąć misję „${mission.title}”?`
    );

    if (!confirmDelete) return;

    try {
      setLoadingMissions(true);
      setError("");
      setSuccessMessage("");

      await deleteMission(activeTheme, mission.id);

      setSuccessMessage("Misja została usunięta.");
      await fetchMissions();
    } catch (error) {
      console.error("Error deleting mission:", error);
      setError("Nie udało się usunąć misji.");
    } finally {
      setLoadingMissions(false);
    }
  };

  const handleDuplicateMission = async (mission) => {
    const confirmDuplicate = window.confirm(
      `Czy chcesz zduplikować misję „${mission.title}” jako szkic?`
    );

    if (!confirmDuplicate) return;

    try {
      setLoadingMissions(true);
      setError("");
      setSuccessMessage("");

      await duplicateMission(activeTheme, mission.id);

      setSuccessMessage("Misja została zduplikowana jako szkic.");
      await fetchMissions();
    } catch (error) {
      console.error("Error duplicating mission:", error);
      setError("Nie udało się zduplikować misji.");
    } finally {
      setLoadingMissions(false);
    }
  };

  const getStatusBadge = (status = "draft") => {
    const styles = {
      draft: "bg-gray-100 text-gray-700",
      published: "bg-green-100 text-green-700",
      archived: "bg-yellow-100 text-yellow-700"
    };

    return styles[status] || styles.draft;
  };

  const getDifficultyBadge = (difficulty = "easy") => {
    const styles = {
      easy: "bg-blue-50 text-blue-700",
      medium: "bg-yellow-50 text-yellow-700",
      hard: "bg-red-50 text-red-700",
      adaptive: "bg-purple-50 text-purple-700"
    };

    return styles[difficulty] || styles.easy;
  };

  const getStatusLabel = (status = "draft") =>
    STATUS_LABELS[status] || STATUS_LABELS.draft;

  const getDifficultyLabel = (difficulty = "easy") =>
    DIFFICULTY_LABELS[difficulty] || DIFFICULTY_LABELS.easy;

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
                Zarządzanie misjami
              </h1>

              <p className="text-gray-600 mt-3 max-w-3xl leading-relaxed">
                Twórz gamifikowane misje konwersacyjne przypisane do tematów
                nauki języka angielskiego.
              </p>

              {activeThemeData && (
                <p className="text-sm text-gray-600 mt-3">
                  Aktywny temat:{" "}
                  <span className="font-semibold">
                    {activeThemeData.icon} {activeThemeData.title}
                  </span>
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate("/admin/temas")}
                className="inline-flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-3 rounded-2xl font-semibold hover:bg-indigo-100"
              >
                <FaLayerGroup />
                Tematy
              </button>

              <button
                type="button"
                onClick={openCreateForm}
                disabled={!activeTheme}
                className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-3 rounded-2xl font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPlus />
                Utwórz misję
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
              <p className="text-xs text-primary-600 font-semibold uppercase">
                Misje
              </p>

              <p className="text-2xl font-bold text-primary-700 mt-1">
                {totalMissions}
              </p>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <p className="text-xs text-green-600 font-semibold uppercase">
                Opublikowane
              </p>

              <p className="text-2xl font-bold text-green-700 mt-1">
                {publishedMissions}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
              <p className="text-xs text-yellow-700 font-semibold uppercase">
                Szkice / inne
              </p>

              <p className="text-2xl font-bold text-yellow-700 mt-1">
                {draftMissions}
              </p>
            </div>
          </div>
        </header>

        {loadingThemes ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
            <FaSpinner className="animate-spin text-primary-600 text-3xl mx-auto mb-3" />
            <p className="text-gray-600">Ładowanie tematów...</p>
          </div>
        ) : themes.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-5 mb-6">
            Nie ma jeszcze utworzonych tematów. Najpierw utwórz temat w panelu
            tematów.
          </div>
        ) : (
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-5 mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Wybierz temat
            </p>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleThemeChange(theme.id)}
                  className={`px-4 py-3 rounded-2xl whitespace-nowrap font-semibold transition-colors ${
                    activeTheme === theme.id
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span className="mr-1">{theme.icon}</span>
                  {theme.title}
                </button>
              ))}
            </div>
          </section>
        )}

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
          <section className="mb-8 bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-5 md:p-6 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
                  {editingMission ? "Edycja misji" : "Nowa misja"}
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  {editingMission ? "Edytuj misję" : "Utwórz misję"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center disabled:opacity-50"
                aria-label="Zamknij formularz"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-5 md:p-6">
              <MissionForm
                initialData={editingMission}
                saving={saving}
                onSubmit={handleSubmitMission}
                onCancel={closeForm}
              />
            </div>
          </section>
        )}

        {loadingMissions ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
            <FaSpinner className="animate-spin text-primary-600 text-3xl mx-auto mb-3" />
            <p className="text-gray-600">Ładowanie misji...</p>
          </div>
        ) : !activeTheme ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center text-gray-500">
            Wybierz temat, aby zarządzać jego misjami.
          </div>
        ) : missions.length === 0 ? (
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12 text-center">
            <FaGamepad className="text-primary-600 text-4xl mx-auto mb-4" />

            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Ten temat nie ma jeszcze misji
            </h2>

            <p className="text-gray-600 mt-2">
              Utwórz pierwszą misję konwersacyjną dla wybranego tematu.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className="mt-5 inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-2xl font-semibold"
            >
              <FaPlus />
              Utwórz pierwszą misję
            </button>
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {missions.map((mission) => (
              <article
                key={mission.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5"
              >
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                      mission.status
                    )}`}
                  >
                    {getStatusLabel(mission.status)}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyBadge(
                      mission.difficulty
                    )}`}
                  >
                    {getDifficultyLabel(mission.difficulty)}
                  </span>

                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">
                    {mission.level || "A1"}
                  </span>

                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700">
                    {mission.xpReward || 10} XP
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 break-words">
                  {mission.title || "Misja bez tytułu"}
                </h2>

                <p className="text-gray-600 mt-2 break-words leading-relaxed">
                  {mission.description || "Brak opisu."}
                </p>

                <div className="mt-4 space-y-2 text-sm text-gray-500">
                  <p className="break-words">
                    <strong>Rola AI:</strong> {mission.aiRole || "N/A"}
                  </p>

                  <p>
                    <strong>Cele:</strong> {mission.objectives?.length || 0}
                  </p>

                  <p>
                    <strong>Czas:</strong>{" "}
                    {mission.estimatedMinutes || 5} min
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => openEditForm(mission)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100"
                  >
                    <FaEdit />
                    Edytuj
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicateMission(mission)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100"
                  >
                    <FaCopy />
                    Kopiuj
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteMission(mission)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-red-50 text-red-700 font-semibold hover:bg-red-100"
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

export default AdminMissions;