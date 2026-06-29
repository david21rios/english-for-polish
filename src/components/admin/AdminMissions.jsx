// src/components/admin/AdminMissions.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCopy,
  FaEdit,
  FaPlus,
  FaSpinner,
  FaTrash
} from "react-icons/fa";

import { db } from "../../firebase";
import MissionForm from "../topics/MissionForm";
import {
  createMission,
  deleteMission,
  duplicateMission,
  getMissionsByTheme,
  updateMission
} from "../../services/firestoreService";

const AdminMissions = () => {
  const navigate = useNavigate();

  const [temas, setTemas] = useState([]);
  const [activeTheme, setActiveTheme] = useState("");
  const [missions, setMissions] = useState([]);
  const [editingMission, setEditingMission] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeThemeData = useMemo(
    () => temas.find((tema) => tema.id === activeTheme),
    [temas, activeTheme]
  );

  const fetchThemes = useCallback(async () => {
    try {
      setLoadingThemes(true);
      setError("");

      const temasSnapshot = await getDocs(collection(db, "temas"));

      const temasData = temasSnapshot.docs
        .map((document) => ({
          id: document.id,
          ...document.data()
        }))
        .sort((a, b) => (Number(a.numero) || 0) - (Number(b.numero) || 0));

      setTemas(temasData);

      if (temasData.length > 0) {
        setActiveTheme((prev) => prev || temasData[0].id);
      }
    } catch (error) {
      console.error("Error loading themes:", error);
      setError("Error al cargar los temas.");
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

      setMissions(data);
    } catch (error) {
      console.error("Error loading missions:", error);
      setError("Error al cargar las misiones.");
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

  const resetForm = () => {
    setEditingMission(null);
    setIsCreating(false);
    setError("");
    setSuccessMessage("");
  };

  const handleThemeChange = (themeId) => {
    setActiveTheme(themeId);
    setEditingMission(null);
    setIsCreating(false);
    setError("");
    setSuccessMessage("");
  };

  const handleStartCreate = () => {
    if (!activeTheme) {
      setError("Primero debes seleccionar un tema.");
      return;
    }

    setEditingMission(null);
    setIsCreating(true);
    setError("");
    setSuccessMessage("");
  };

  const handleSubmitMission = async (missionData) => {
    if (!activeTheme) {
      setError("Primero debes seleccionar un tema.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      if (editingMission?.id) {
        await updateMission(activeTheme, editingMission.id, missionData);
        setSuccessMessage("Misión actualizada correctamente.");
      } else {
        await createMission(activeTheme, missionData);
        setSuccessMessage("Misión creada correctamente.");
      }

      resetForm();
      await fetchMissions();
    } catch (error) {
      console.error("Error saving mission:", error);
      setError(`Error al guardar la misión: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditMission = (mission) => {
    setEditingMission(mission);
    setIsCreating(false);
    setError("");
    setSuccessMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleDeleteMission = async (mission) => {
    const confirmDelete = window.confirm(
      `¿Seguro que deseas eliminar la misión "${mission.title}"?`
    );

    if (!confirmDelete) return;

    try {
      setLoadingMissions(true);
      setError("");
      setSuccessMessage("");

      await deleteMission(activeTheme, mission.id);

      setSuccessMessage("Misión eliminada correctamente.");
      await fetchMissions();
    } catch (error) {
      console.error("Error deleting mission:", error);
      setError("Error al eliminar la misión.");
    } finally {
      setLoadingMissions(false);
    }
  };

  const handleDuplicateMission = async (mission) => {
    const confirmDuplicate = window.confirm(
      `¿Deseas duplicar la misión "${mission.title}" como borrador?`
    );

    if (!confirmDuplicate) return;

    try {
      setLoadingMissions(true);
      setError("");
      setSuccessMessage("");

      await duplicateMission(activeTheme, mission.id);

      setSuccessMessage("Misión duplicada correctamente como borrador.");
      await fetchMissions();
    } catch (error) {
      console.error("Error duplicating mission:", error);
      setError("Error al duplicar la misión.");
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <button
        type="button"
        onClick={() => navigate("/admin")}
        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium"
      >
        <FaArrowLeft />
        Volver al panel admin
      </button>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Misiones
          </h1>

          <p className="text-gray-600 mt-2">
            Crea misiones conversacionales gamificadas por tema.
          </p>

          {activeThemeData && (
            <p className="text-sm text-gray-600 mt-2">
              Tema activo:{" "}
              <span className="font-semibold">
                {activeThemeData.icon} {activeThemeData.title}
              </span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleStartCreate}
          disabled={!activeTheme}
          className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaPlus />
          Nueva misión
        </button>
      </div>

      {loadingThemes ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <FaSpinner className="animate-spin text-primary-600 text-3xl mx-auto mb-3" />
          <p className="text-gray-600">Cargando temas...</p>
        </div>
      ) : temas.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-5 mb-6">
          No hay temas creados. Primero crea temas desde el panel de temas.
        </div>
      ) : (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Selecciona un tema
          </p>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {temas.map((tema) => (
              <button
                key={tema.id}
                type="button"
                onClick={() => handleThemeChange(tema.id)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap font-medium transition-colors ${
                  activeTheme === tema.id
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="mr-1">{tema.icon}</span>
                {tema.title}
              </button>
            ))}
          </div>
        </section>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          {successMessage}
        </div>
      )}

      {(isCreating || editingMission) && (
        <div className="mb-8">
          <MissionForm
            initialData={editingMission}
            saving={saving}
            onSubmit={handleSubmitMission}
            onCancel={resetForm}
          />
        </div>
      )}

      {loadingMissions ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <FaSpinner className="animate-spin text-primary-600 text-3xl mx-auto mb-3" />
          <p className="text-gray-600">Cargando misiones...</p>
        </div>
      ) : !activeTheme ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-500">
          Selecciona un tema para administrar sus misiones.
        </div>
      ) : missions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-500">
          Este tema todavía no tiene misiones.
        </div>
      ) : (
        <section className="grid gap-4">
          {missions.map((mission) => (
            <article
              key={mission.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(
                        mission.status
                      )}`}
                    >
                      {mission.status || "draft"}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getDifficultyBadge(
                        mission.difficulty
                      )}`}
                    >
                      {mission.difficulty || "easy"}
                    </span>

                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">
                      {mission.level || "A1"}
                    </span>

                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700">
                      {mission.xpReward || 10} XP
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 break-words">
                    {mission.title}
                  </h2>

                  <p className="text-gray-600 mt-2 break-words">
                    {mission.description}
                  </p>

                  <p className="text-sm text-gray-500 mt-2 break-words">
                    <strong>AI role:</strong> {mission.aiRole || "N/A"}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    <strong>Objectives:</strong>{" "}
                    {mission.objectives?.length || 0}
                  </p>
                </div>

                <div className="flex flex-wrap lg:flex-col gap-2 lg:items-end">
                  <button
                    type="button"
                    onClick={() => handleEditMission(mission)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100"
                  >
                    <FaEdit />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicateMission(mission)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100"
                  >
                    <FaCopy />
                    Duplicar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteMission(mission)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 font-semibold hover:bg-red-100"
                  >
                    <FaTrash />
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default AdminMissions;