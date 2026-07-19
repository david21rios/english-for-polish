// src/components/admin/AdminMissions.jsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate,
  useSearchParams
} from "react-router-dom";

import {
  FaArrowLeft,
  FaGamepad,
  FaPlus,
  FaSpinner
} from "react-icons/fa";

import {
  createMission,
  deleteMission,
  duplicateMission,
  getAllThemes,
  getMissionsByTheme,
  restoreMission,
  updateMission
} from "../../services/auth/firestoreService";

import AdminMissionCard from "../topics/admin/AdminMissionCard";
import MissionAdminHeader from "../topics/admin/MissionAdminHeader";
import MissionEditorPanel from "../topics/admin/MissionEditorPanel";
import MissionStatusFilter from "../topics/admin/MissionStatusFilter";
import MissionThemeSelector from "../topics/admin/MissionThemeSelector";

const isArchivedMission = (mission = {}) => {
  return (
    mission.isDeleted === true ||
    mission.status === "archived"
  );
};

const AdminMissions = () => {
  const navigate = useNavigate();

  const [
    searchParams,
    setSearchParams
  ] = useSearchParams();

  const [themes, setThemes] =
    useState([]);

  const [
    activeThemeId,
    setActiveThemeId
  ] = useState("");

  const [missions, setMissions] =
    useState([]);

  const [
    missionFilter,
    setMissionFilter
  ] = useState("active");

  const [
    editingMission,
    setEditingMission
  ] = useState(null);

  const [
    isFormOpen,
    setIsFormOpen
  ] = useState(false);

  const [
    loadingThemes,
    setLoadingThemes
  ] = useState(true);

  const [
    loadingMissions,
    setLoadingMissions
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    processingMissionId,
    setProcessingMissionId
  ] = useState(null);

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage
  ] = useState("");

  const requestedThemeId =
    searchParams.get("themeId") || "";

  const activeTheme = useMemo(() => {
    return themes.find(
      (theme) =>
        theme.id === activeThemeId
    );
  }, [
    themes,
    activeThemeId
  ]);

  const activeMissions =
    useMemo(() => {
      return missions.filter(
        (mission) =>
          !isArchivedMission(
            mission
          )
      );
    }, [missions]);

  const archivedMissions =
    useMemo(() => {
      return missions.filter(
        (mission) =>
          isArchivedMission(
            mission
          )
      );
    }, [missions]);

  const visibleMissions =
    useMemo(() => {
      if (
        missionFilter ===
        "archived"
      ) {
        return archivedMissions;
      }

      if (
        missionFilter ===
        "all"
      ) {
        return missions;
      }

      return activeMissions;
    }, [
      activeMissions,
      archivedMissions,
      missionFilter,
      missions
    ]);

  const publishedMissions =
    useMemo(() => {
      return activeMissions.filter(
        (mission) =>
          mission.status ===
          "published"
      ).length;
    }, [activeMissions]);

  const draftMissions =
    useMemo(() => {
      return activeMissions.filter(
        (mission) =>
          mission.status ===
          "draft"
      ).length;
    }, [activeMissions]);

  const updateThemeInUrl =
    useCallback(
      (
        themeId,
        {
          replace = false
        } = {}
      ) => {
        const nextParams =
          new URLSearchParams(
            searchParams
          );

        if (themeId) {
          nextParams.set(
            "themeId",
            themeId
          );
        } else {
          nextParams.delete(
            "themeId"
          );
        }

        setSearchParams(
          nextParams,
          {
            replace
          }
        );
      },
      [
        searchParams,
        setSearchParams
      ]
    );

  const fetchThemes =
    useCallback(async () => {
      try {
        setLoadingThemes(true);
        setError("");

        const themesData =
          await getAllThemes();

        setThemes(
          Array.isArray(
            themesData
          )
            ? themesData
            : []
        );
      } catch (loadError) {
        console.error(
          "Error loading themes:",
          loadError
        );

        setError(
          "Nie udało się załadować tematów."
        );
      } finally {
        setLoadingThemes(false);
      }
    }, []);

  const fetchMissions =
    useCallback(async () => {
      if (!activeThemeId) {
        setMissions([]);
        return;
      }

      try {
        setLoadingMissions(true);
        setError("");

        const data =
          await getMissionsByTheme(
            activeThemeId,
            {
              includeDrafts: true,
              includeArchived: true
            }
          );

        setMissions(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (loadError) {
        console.error(
          "Error loading missions:",
          loadError
        );

        setError(
          "Nie udało się załadować misji."
        );

        setMissions([]);
      } finally {
        setLoadingMissions(false);
      }
    }, [activeThemeId]);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  useEffect(() => {
    if (
      loadingThemes ||
      themes.length === 0
    ) {
      return;
    }

    const requestedThemeExists =
      themes.some(
        (theme) =>
          theme.id ===
          requestedThemeId
      );

    const currentThemeExists =
      themes.some(
        (theme) =>
          theme.id ===
          activeThemeId
      );

    const resolvedThemeId =
      requestedThemeExists
        ? requestedThemeId
        : currentThemeExists
          ? activeThemeId
          : themes[0].id;

    if (
      resolvedThemeId !==
      activeThemeId
    ) {
      setActiveThemeId(
        resolvedThemeId
      );
    }

    if (
      resolvedThemeId !==
      requestedThemeId
    ) {
      updateThemeInUrl(
        resolvedThemeId,
        {
          replace: true
        }
      );
    }
  }, [
    activeThemeId,
    loadingThemes,
    requestedThemeId,
    themes,
    updateThemeInUrl
  ]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const closeForm = () => {
    setEditingMission(null);
    setIsFormOpen(false);
    setError("");
  };

  const handleThemeChange = (
    themeId
  ) => {
    if (
      !themes.some(
        (theme) =>
          theme.id === themeId
      )
    ) {
      setError(
        "Wybrany temat nie istnieje lub jest zarchiwizowany."
      );

      return;
    }

    setActiveThemeId(themeId);
    setEditingMission(null);
    setIsFormOpen(false);
    setMissionFilter("active");

    clearMessages();

    updateThemeInUrl(themeId);
  };

  const openCreateForm = () => {
    if (!activeThemeId) {
      setError(
        "Najpierw wybierz temat."
      );

      return;
    }

    setEditingMission(null);
    setIsFormOpen(true);

    clearMessages();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const openEditForm = (
    mission
  ) => {
    if (
      isArchivedMission(
        mission
      )
    ) {
      setError(
        "Przed edycją należy przywrócić zarchiwizowaną misję."
      );

      return;
    }

    setEditingMission(mission);
    setIsFormOpen(true);

    clearMessages();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleSubmitMission =
    async (missionData) => {
      if (!activeThemeId) {
        setError(
          "Najpierw wybierz temat."
        );

        return;
      }

      if (saving) {
        return;
      }

      try {
        setSaving(true);
        clearMessages();

        if (editingMission?.id) {
          await updateMission(
            activeThemeId,
            editingMission.id,
            missionData
          );

          setSuccessMessage(
            "Misja została zaktualizowana."
          );
        } else {
          await createMission(
            activeThemeId,
            missionData
          );

          setSuccessMessage(
            "Misja została utworzona."
          );
        }

        setEditingMission(null);
        setIsFormOpen(false);

        await fetchMissions();
      } catch (saveError) {
        console.error(
          "Error saving mission:",
          saveError
        );

        setError(
          saveError?.message
            ? `Nie udało się zapisać misji: ${saveError.message}`
            : "Nie udało się zapisać misji."
        );
      } finally {
        setSaving(false);
      }
    };

  const handleArchiveMission =
    async (mission) => {
      if (
        !activeThemeId ||
        !mission?.id
      ) {
        setError(
          "Nie można zarchiwizować nieprawidłowej misji."
        );

        return;
      }

      const confirmed =
        window.confirm(
          [
            `Czy na pewno chcesz zarchiwizować misję „${mission.title}”?`,
            "",
            "Misja zostanie ukryta przed uczniami.",
            "Jej dane zostaną zachowane."
          ].join("\n")
        );

      if (!confirmed) {
        return;
      }

      try {
        setProcessingMissionId(
          mission.id
        );

        clearMessages();

        await deleteMission(
          activeThemeId,
          mission.id
        );

        if (
          editingMission?.id ===
          mission.id
        ) {
          closeForm();
        }

        setSuccessMessage(
          "Misja została zarchiwizowana."
        );

        await fetchMissions();
      } catch (archiveError) {
        console.error(
          "Error archiving mission:",
          archiveError
        );

        setError(
          archiveError?.message ||
            "Nie udało się zarchiwizować misji."
        );
      } finally {
        setProcessingMissionId(
          null
        );
      }
    };

  const handleRestoreMission =
    async (mission) => {
      if (
        !activeThemeId ||
        !mission?.id
      ) {
        setError(
          "Nie można przywrócić nieprawidłowej misji."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Czy na pewno chcesz przywrócić misję „${mission.title}”?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setProcessingMissionId(
          mission.id
        );

        clearMessages();

        await restoreMission(
          activeThemeId,
          mission.id
        );

        setSuccessMessage(
          "Misja została przywrócona."
        );

        await fetchMissions();
      } catch (restoreError) {
        console.error(
          "Error restoring mission:",
          restoreError
        );

        setError(
          restoreError?.message ||
            "Nie udało się przywrócić misji."
        );
      } finally {
        setProcessingMissionId(
          null
        );
      }
    };

  const handleDuplicateMission =
    async (mission) => {
      if (
        !activeThemeId ||
        !mission?.id
      ) {
        setError(
          "Nie można zduplikować nieprawidłowej misji."
        );

        return;
      }

      if (
        isArchivedMission(
          mission
        )
      ) {
        setError(
          "Nie można kopiować zarchiwizowanej misji."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Czy chcesz zduplikować misję „${mission.title}” jako szkic?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setProcessingMissionId(
          mission.id
        );

        clearMessages();

        await duplicateMission(
          activeThemeId,
          mission.id
        );

        setSuccessMessage(
          "Misja została zduplikowana jako szkic."
        );

        await fetchMissions();
      } catch (duplicateError) {
        console.error(
          "Error duplicating mission:",
          duplicateError
        );

        setError(
          duplicateError?.message ||
            "Nie udało się zduplikować misji."
        );
      } finally {
        setProcessingMissionId(
          null
        );
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

        <MissionAdminHeader
          activeTheme={activeTheme}
          totalMissions={
            missions.length
          }
          publishedMissions={
            publishedMissions
          }
          draftMissions={
            draftMissions
          }
          archivedMissions={
            archivedMissions.length
          }
          onOpenThemes={() =>
            navigate(
              "/admin/temas"
            )
          }
          onCreateMission={
            openCreateForm
          }
        />

        <MissionThemeSelector
          themes={themes}
          activeThemeId={
            activeThemeId
          }
          loading={
            loadingThemes
          }
          onSelectTheme={
            handleThemeChange
          }
        />

        <MissionStatusFilter
          value={missionFilter}
          activeCount={
            activeMissions.length
          }
          archivedCount={
            archivedMissions.length
          }
          totalCount={
            missions.length
          }
          onChange={
            setMissionFilter
          }
        />

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
          <MissionEditorPanel
            editingMission={
              editingMission
            }
            missions={
              activeMissions
            }
            saving={saving}
            onSubmit={
              handleSubmitMission
            }
            onCancel={
              closeForm
            }
          />
        )}

        {loadingMissions ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <FaSpinner className="mx-auto mb-3 animate-spin text-3xl text-primary-600" />

            <p className="text-gray-600">
              Ładowanie misji...
            </p>
          </div>
        ) : !activeThemeId ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
            Wybierz temat, aby zarządzać jego misjami.
          </div>
        ) : visibleMissions.length === 0 ? (
          <section className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm md:p-12">
            <FaGamepad className="mx-auto mb-4 text-4xl text-primary-600" />

            <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
              {missionFilter === "archived"
                ? "Brak zarchiwizowanych misji"
                : "Ten temat nie ma jeszcze misji"}
            </h2>

            <p className="mt-2 text-gray-600">
              {missionFilter === "archived"
                ? "Zarchiwizowane misje pojawią się tutaj."
                : "Utwórz pierwszą misję konwersacyjną dla wybranego tematu."}
            </p>

            {missionFilter !==
              "archived" && (
              <button
                type="button"
                onClick={
                  openCreateForm
                }
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700"
              >
                <FaPlus />
                Utwórz pierwszą misję
              </button>
            )}
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleMissions.map(
              (mission) => (
                <AdminMissionCard
                  key={mission.id}
                  mission={mission}
                  processing={
                    processingMissionId ===
                    mission.id
                  }
                  onEdit={
                    openEditForm
                  }
                  onDuplicate={
                    handleDuplicateMission
                  }
                  onArchive={
                    handleArchiveMission
                  }
                  onRestore={
                    handleRestoreMission
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

export default AdminMissions;