// src/components/AdminForumReports.jsx

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  FaCheckCircle,
  FaFlag,
  FaTrash,
  FaUndo,
  FaBan,
  FaExclamationTriangle
} from "react-icons/fa";

import {
  deleteForumPost,
  deleteForumPostAndResolveReport,
  deleteForumReport,
  updateForumReportStatus
} from "../../services/forumModerationService";
import { blockForumUser } from "../../services/forumAdminService";

const AdminForumReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const loadReports = async () => {
    try {
      setLoading(true);

      const reportsRef = collection(db, "forumReports");
      const reportsQuery = query(reportsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(reportsQuery);

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));

      setReports(data);
    } catch (error) {
      console.error("Error loading forum reports:", error);
      alert("No se pudieron cargar los reportes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const setReportLoading = (reportId, value) => {
    setActionLoading((prev) => ({
      ...prev,
      [reportId]: value
    }));
  };

  const updateReportStatus = async (reportId, status) => {
    try {
      setReportLoading(reportId, true);

      await updateForumReportStatus({
        reportId,
        status
      });

      await loadReports();
    } catch (error) {
      console.error("Error updating report:", error);
      alert("No se pudo actualizar el reporte.");
    } finally {
      setReportLoading(reportId, false);
    }
  };

  const deleteReport = async (reportId) => {
    const confirmDelete = window.confirm(
      "¿Seguro que deseas eliminar este reporte?"
    );

    if (!confirmDelete) return;

    try {
      setReportLoading(reportId, true);

      await deleteForumReport(reportId);

      await loadReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("No se pudo eliminar el reporte.");
    } finally {
      setReportLoading(reportId, false);
    }
  };

  const handleDeletePost = async (report) => {
    const confirmDelete = window.confirm(
      "¿Seguro que deseas eliminar la publicación reportada? Esta acción no se puede deshacer."
    );

    if (!confirmDelete) return;

    try {
      setReportLoading(report.id, true);

      await deleteForumPost({
        level: report.level,
        postId: report.postId
      });

      await loadReports();

      alert("Publicación eliminada correctamente.");
    } catch (error) {
      console.error("Error deleting forum post:", error);
      alert("No se pudo eliminar la publicación.");
    } finally {
      setReportLoading(report.id, false);
    }
  };

  const handleDeletePostAndResolve = async (report) => {
    const confirmDelete = window.confirm(
      "¿Seguro que deseas eliminar la publicación y marcar este reporte como resuelto? Esta acción no se puede deshacer."
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

      alert("Publicación eliminada y reporte resuelto.");
    } catch (error) {
      console.error("Error deleting post and resolving report:", error);
      alert("No se pudo eliminar la publicación y resolver el reporte.");
    } finally {
      setReportLoading(report.id, false);
    }
  };

  const handleBlockAuthor = async (report) => {
    if (!report.postUserId) {
      alert("Este reporte no tiene el ID del autor de la publicación.");
      return;
    }

    const confirmBlock = window.confirm(
      "¿Seguro que deseas bloquear a este usuario del foro?"
    );

    if (!confirmBlock) return;

    try {
      setReportLoading(report.id, true);

      await blockForumUser({
        userId: report.postUserId,
        reason: report.reason || "Forum rules violation"
      });

      await updateForumReportStatus({
        reportId: report.id,
        status: "resolved"
      });

      await loadReports();

      alert("Usuario bloqueado del foro y reporte resuelto.");
    } catch (error) {
      console.error("Error blocking forum user:", error);
      alert("No se pudo bloquear al usuario.");
    } finally {
      setReportLoading(report.id, false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "Sin fecha";
    return timestamp.toDate().toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
        <p className="text-gray-600 mt-4">Cargando reportes...</p>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl">
          <FaFlag />
        </div>

        <div>
          <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">
            Forum moderation
          </p>

          <h2 className="text-3xl font-bold text-gray-900">
            Reportes del foro
          </h2>

          <p className="text-gray-600 mt-1">
            Revisa publicaciones reportadas por los estudiantes.
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center text-gray-600">
          No hay reportes pendientes.
        </div>
      ) : (
        <div className="space-y-5">
          {reports.map((report) => {
            const isActionLoading = actionLoading[report.id];

            return (
              <article
                key={report.id}
                className="border border-gray-100 rounded-3xl p-5 bg-gray-50"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {report.reason || "Sin motivo"}
                      </span>

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          report.status === "resolved"
                            ? "bg-green-100 text-green-700"
                            : report.status === "dismissed"
                            ? "bg-gray-200 text-gray-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {report.status || "pending"}
                      </span>

                      <span className="text-sm text-gray-500">
                        Nivel: {report.level || "No definido"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mb-2">
                      Fecha: {formatDate(report.createdAt)}
                    </p>

                    <p className="text-sm text-gray-500 mb-2">
                      Reportado por: {report.reporterEmail || report.reportedBy}
                    </p>

                    <div className="bg-white border border-gray-100 rounded-2xl p-4 mt-4">
                      <p className="text-sm font-semibold text-gray-500 mb-2">
                        Publicación reportada
                      </p>

                      <p className="text-gray-800 whitespace-pre-wrap">
                        {report.postText || "Sin contenido guardado"}
                      </p>
                    </div>

                    {report.details && (
                      <div className="bg-white border border-gray-100 rounded-2xl p-4 mt-4">
                        <p className="text-sm font-semibold text-gray-500 mb-2">
                          Detalles adicionales
                        </p>

                        <p className="text-gray-800 whitespace-pre-wrap">
                          {report.details}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[230px]">
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() =>
                        updateReportStatus(report.id, "resolved")
                      }
                      className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-2xl font-semibold disabled:opacity-50"
                    >
                      <FaCheckCircle />
                      Resolver
                    </button>

                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() =>
                        updateReportStatus(report.id, "dismissed")
                      }
                      className="inline-flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-2xl font-semibold disabled:opacity-50"
                    >
                      <FaUndo />
                      Descartar
                    </button>

                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => handleDeletePost(report)}
                      className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-2xl font-semibold disabled:opacity-50"
                    >
                      <FaExclamationTriangle />
                      Eliminar publicación
                    </button>

                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => handleDeletePostAndResolve(report)}
                      className="inline-flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-3 rounded-2xl font-semibold disabled:opacity-50"
                    >
                      <FaTrash />
                      Eliminar y resolver
                    </button>

                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => handleBlockAuthor(report)}
                      className="inline-flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white px-4 py-3 rounded-2xl font-semibold disabled:opacity-50"
                    >
                      <FaBan />
                      Bloquear autor
                    </button>

                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => deleteReport(report.id)}
                      className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-2xl font-semibold disabled:opacity-50"
                    >
                      <FaTrash />
                      Eliminar reporte
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