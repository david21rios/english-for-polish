// src/components/AdminForumReports.jsx

import { useCallback, useEffect, useState } from "react";

import {
  FaBan,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFlag,
  FaTrash,
  FaArrowLeft,
  FaUndo
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  deleteForumPost,
  deleteForumPostAndResolveReport,
  deleteForumReport,
  getForumReports,
  updateForumReportStatus
} from "../../services/forum/forumModerationService";

import { blockForumUser } from "../../services/forum/forumAdminService";

const STATUS_LABELS = {
  pending: "Oczekujące",
  resolved: "Rozwiązane",
  dismissed: "Odrzucone"
};

const getStatusLabel = (status) => {
  return STATUS_LABELS[status] || STATUS_LABELS.pending;
};

const getStatusClassName = (status) => {
  if (status === "resolved") {
    return "bg-green-100 text-green-700";
  }

  if (status === "dismissed") {
    return "bg-gray-200 text-gray-700";
  }

  return "bg-yellow-100 text-yellow-700";
};

const formatDate = (value) => {
  if (!value) return "Brak daty";

  try {
    const date =
      typeof value.toDate === "function"
        ? value.toDate()
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Brak daty";
    }

    return date.toLocaleString("pl-PL");
  } catch {
    return "Brak daty";
  }
};

const AdminForumReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getForumReports();

      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading forum reports:", error);

      window.alert(
        "Nie udało się załadować zgłoszeń z forum."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const setReportLoading = (reportId, value) => {
    setActionLoading((prev) => ({
      ...prev,
      [reportId]: value
    }));
  };

  const updateReportStatus = async (reportId, status) => {
    if (!reportId || !status) return;

    try {
      setReportLoading(reportId, true);

      await updateForumReportStatus({
        reportId,
        status
      });

      await loadReports();
    } catch (error) {
      console.error("Error updating forum report:", error);

      window.alert(
        "Nie udało się zaktualizować zgłoszenia."
      );
    } finally {
      setReportLoading(reportId, false);
    }
  };

  const deleteReport = async (reportId) => {
    if (!reportId) return;

    const confirmDelete = window.confirm(
      "Czy na pewno chcesz usunąć to zgłoszenie?"
    );

    if (!confirmDelete) return;

    try {
      setReportLoading(reportId, true);

      await deleteForumReport(reportId);

      await loadReports();
    } catch (error) {
      console.error("Error deleting forum report:", error);

      window.alert(
        "Nie udało się usunąć zgłoszenia."
      );
    } finally {
      setReportLoading(reportId, false);
    }
  };

  const handleDeletePost = async (report) => {
    if (!report?.id) return;

    if (!report.level || !report.postId) {
      window.alert(
        "Brakuje danych wymaganych do usunięcia zgłoszonego wpisu."
      );

      return;
    }

    const confirmDelete = window.confirm(
      "Czy na pewno chcesz usunąć zgłoszony wpis? Tej operacji nie można cofnąć."
    );

    if (!confirmDelete) return;

    try {
      setReportLoading(report.id, true);

      await deleteForumPost({
        level: report.level,
        postId: report.postId
      });

      await loadReports();

      window.alert(
        "Wpis został pomyślnie usunięty."
      );
    } catch (error) {
      console.error("Error deleting forum post:", error);

      window.alert(
        "Nie udało się usunąć wpisu."
      );
    } finally {
      setReportLoading(report.id, false);
    }
  };

  const handleDeletePostAndResolve = async (report) => {
    if (!report?.id) return;

    if (!report.level || !report.postId) {
      window.alert(
        "Brakuje danych wymaganych do usunięcia wpisu i rozwiązania zgłoszenia."
      );

      return;
    }

    const confirmDelete = window.confirm(
      "Czy na pewno chcesz usunąć wpis i oznaczyć zgłoszenie jako rozwiązane? Tej operacji nie można cofnąć."
    );

    if (!confirmDelete) return;

    try {
      setReportLoading(report.id, true);

      await deleteForumPostAndResolveReport({
        level: report.level,
        postId: report.postId,
        reportId: report.id
      });

      await loadReports();

      window.alert(
        "Wpis został usunięty, a zgłoszenie oznaczone jako rozwiązane."
      );
    } catch (error) {
      console.error(
        "Error deleting post and resolving report:",
        error
      );

      window.alert(
        "Nie udało się usunąć wpisu i rozwiązać zgłoszenia."
      );
    } finally {
      setReportLoading(report.id, false);
    }
  };

  const handleBlockAuthor = async (report) => {
    if (!report?.id) return;

    if (!report.postUserId) {
      window.alert(
        "To zgłoszenie nie zawiera identyfikatora autora wpisu."
      );

      return;
    }

    const confirmBlock = window.confirm(
      "Czy na pewno chcesz zablokować temu użytkownikowi dostęp do forum?"
    );

    if (!confirmBlock) return;

    try {
      setReportLoading(report.id, true);

      await blockForumUser({
        userId: report.postUserId,
        reason:
          report.reason ||
          "Forum rules violation"
      });

      await updateForumReportStatus({
        reportId: report.id,
        status: "resolved"
      });

      await loadReports();

      window.alert(
        "Użytkownik został zablokowany na forum, a zgłoszenie oznaczone jako rozwiązane."
      );
    } catch (error) {
      console.error("Error blocking forum user:", error);

      window.alert(
        "Nie udało się zablokować użytkownika."
      );
    } finally {
      setReportLoading(report.id, false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />

        <p className="text-gray-600 mt-4">
          Ładowanie zgłoszeń...
        </p>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8">
      <button
        type="button"
        onClick={() => navigate("/admin")}
        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium"
      >
        <FaArrowLeft />
        Wróć do panelu administratora
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl">
          <FaFlag />
        </div>

        <div>
          <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">
            Moderacja forum
          </p>

          <h2 className="text-3xl font-bold text-gray-900">
            Zgłoszenia na forum
          </h2>

          <p className="text-gray-600 mt-1">
            Przeglądaj i moderuj wpisy zgłoszone przez użytkowników.
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center text-gray-600">
          Brak zgłoszeń do wyświetlenia.
        </div>
      ) : (
        <div className="space-y-5">
          {reports.map((report) => {
            const isActionLoading =
              actionLoading[report.id] === true;

            const reportStatus =
              report.status || "pending";

            return (
              <article
                key={report.id}
                className="border border-gray-100 rounded-3xl p-5 bg-gray-50"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {report.reason || "Brak podanego powodu"}
                      </span>

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClassName(
                          reportStatus
                        )}`}
                      >
                        {getStatusLabel(reportStatus)}
                      </span>

                      <span className="text-sm text-gray-500">
                        Poziom:{" "}
                        {report.level || "Nie określono"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mb-2">
                      Data: {formatDate(report.createdAt)}
                    </p>

                    <p className="text-sm text-gray-500 mb-2 break-words">
                      Zgłoszone przez:{" "}
                      {report.reporterEmail ||
                        report.reportedBy ||
                        "Nieznany użytkownik"}
                    </p>

                    <div className="bg-white border border-gray-100 rounded-2xl p-4 mt-4">
                      <p className="text-sm font-semibold text-gray-500 mb-2">
                        Zgłoszony wpis
                      </p>

                      <p className="text-gray-800 whitespace-pre-wrap break-words">
                        {report.postText ||
                          "Brak zapisanej treści wpisu."}
                      </p>
                    </div>

                    {report.details && (
                      <div className="bg-white border border-gray-100 rounded-2xl p-4 mt-4">
                        <p className="text-sm font-semibold text-gray-500 mb-2">
                          Dodatkowe informacje
                        </p>

                        <p className="text-gray-800 whitespace-pre-wrap break-words">
                          {report.details}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-[230px]">
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() =>
                        updateReportStatus(
                          report.id,
                          "resolved"
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaCheckCircle />
                      Rozwiąż
                    </button>

                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() =>
                        updateReportStatus(
                          report.id,
                          "dismissed"
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaUndo />
                      Odrzuć
                    </button>

                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() =>
                        handleDeletePost(report)
                      }
                      className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaExclamationTriangle />
                      Usuń wpis
                    </button>

                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() =>
                        handleDeletePostAndResolve(report)
                      }
                      className="inline-flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaTrash />
                      Usuń i rozwiąż
                    </button>

                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() =>
                        handleBlockAuthor(report)
                      }
                      className="inline-flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white px-4 py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaBan />
                      Zablokuj autora
                    </button>

                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() =>
                        deleteReport(report.id)
                      }
                      className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaTrash />
                      Usuń zgłoszenie
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AdminForumReports;