// src/components/Admin.jsx
import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import {
  FaSpinner,
  FaArrowLeft
} from "react-icons/fa";
import { countries } from "../../utils/countries";
import {
  isUserAdmin,
  updateUserRole,
  toggleUserForumBlock,
  deleteUserAccount
} from "../../services/firestoreService";
import { initializeDatabase } from "../../services/initializeData";
import AdminUsersTable from "./AdminUsersTable";
import AdminNavigationCards from "./AdminNavigationCards";
import UserDetailsModal from "./UserDetailsModal";

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initLoading, setInitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [updateLoading, setUpdateLoading] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAndLoadUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!auth.currentUser) {
          navigate("/login");
          return;
        }

        if (!auth.currentUser.emailVerified) {
          navigate("/verification-pending", {
            replace: true,
            state: {
              email: auth.currentUser.email
            }
          });
          return;
        }

        const adminStatus = await isUserAdmin(auth.currentUser.uid);

        if (!adminStatus) {
          navigate("/home");
          return;
        }

        const usersRef = collection(db, "users");
        const usersSnap = await getDocs(usersRef);

        const usersData = [];

        for (const userDocument of usersSnap.docs) {
          const userData = userDocument.data();

          const testsRef = collection(db, "userTests");
          const q = query(
            testsRef,
            where("userId", "==", userDocument.id),
            orderBy("testDate", "desc"),
            limit(3)
          );

          const testsSnap = await getDocs(q);

          const lastTests = testsSnap.docs.map((testDocument) => ({
            date: testDocument.data().testDate?.toDate?.() || null,
            score: testDocument.data().results?.overallScore || 0,
            level: testDocument.data().results?.finalLevel || "N/A"
          }));

          usersData.push({
            id: userDocument.id,
            name: userData.name || "N/A",
            lastName: userData.lastName || "N/A",
            email: userData.email || "N/A",
            lastLogin: userData.lastLogin?.toDate?.() || null,
            country: userData.country || "",
            forumBlocked: userData.forumBlocked === true,
            role: userData.role || "user",
            ageGroup: userData.ageGroup || "all",
            emailVerified: userData.emailVerified || false,

            currentLevel: userData.currentLevel || "N/A",
            placementLevel: userData.placementLevel || "N/A",
            isActive: userData.isActive !== false,

            tests: lastTests
          });
        }

        setUsers(usersData);
      } catch (err) {
        console.error("Error loading admin data:", err);
        setError("Error al cargar los datos. Por favor, intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoadUsers();
  }, [navigate]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      if (userId === auth.currentUser?.uid) {
        setError("No puedes cambiar tu propio rol desde este panel.");
        return;
      }

      const confirmChange = window.confirm(
        `¿Seguro que deseas cambiar el rol de este usuario a ${newRole}?`
      );

      if (!confirmChange) return;

      setUpdateLoading((prev) => ({ ...prev, [userId]: true }));
      setError(null);
      setSuccessMessage("");

      await updateUserRole(userId, newRole);

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      setSuccessMessage("Rol actualizado correctamente.");
    } catch (error) {
      console.error("Error al actualizar el rol:", error);
      setError(`Error al actualizar el rol del usuario: ${error.message}`);
    } finally {
      setUpdateLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleToggleForumBlock = async (userId, isCurrentlyBlocked) => {
    try {
      if (userId === auth.currentUser?.uid) {
        setError("No puedes bloquear tu propio acceso al foro.");
        return;
      }

      const nextBlockedState = !isCurrentlyBlocked;

      const confirmAction = window.confirm(
        nextBlockedState
          ? "¿Seguro que deseas bloquear a este usuario del foro?"
          : "¿Seguro que deseas desbloquear a este usuario del foro?"
      );

      if (!confirmAction) return;

      setUpdateLoading((prev) => ({ ...prev, [userId]: true }));
      setError(null);
      setSuccessMessage("");

      await toggleUserForumBlock({
        userId,
        blocked: nextBlockedState
      });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? { ...user, forumBlocked: nextBlockedState }
            : user
        )
      );

      setSuccessMessage(
        nextBlockedState
          ? "Usuario bloqueado del foro correctamente."
          : "Usuario desbloqueado del foro correctamente."
      );
    } catch (error) {
      console.error("Error cambiando estado del foro:", error);
      setError(`No se pudo actualizar el acceso al foro: ${error.message}`);
    } finally {
      setUpdateLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteUser = async (user) => {
    try {
      if (!user?.id) {
        setError("Usuario no válido.");
        return;
      }

      if (user.id === auth.currentUser?.uid) {
        setError(
          "No puedes eliminar tu propio usuario desde este panel."
        );
        return;
      }

      const confirmDelete = window.confirm(
        `¿Eliminar al usuario "${user.name} ${user.lastName}"?

          Esta acción:
          • eliminará su documento en Firestore
          • eliminará su progreso visible en el panel de administración
          • NO eliminará todavía su cuenta de Firebase Authentication
              
          Esta acción no se puede deshacer.`
      );

      if (!confirmDelete) return;

      setUpdateLoading((prev) => ({
        ...prev,
        [user.id]: true
      }));

      setError(null);
      setSuccessMessage("");

      await deleteUserAccount(user.id);

      // Cerrar primero el modal
      setSelectedUser(null);

      // Actualizar la lista
      setUsers((prevUsers) =>
        prevUsers.filter(
          (item) => item.id !== user.id
        )
      );

      setSuccessMessage(
        "Usuario eliminado correctamente de Firestore."
      );
    } catch (error) {
      console.error("Error eliminando usuario:", error);

      setError(
        `No se pudo eliminar el usuario: ${error.message}`
      );
    } finally {
      if (user?.id) {
        setUpdateLoading((prev) => ({
          ...prev,
          [user.id]: false
        }));
      }
    }
  };

  const handleInitializeDatabase = async () => {
    try {
      const confirmInit = window.confirm(
        "¿Deseas inicializar o actualizar la estructura base de niveles?"
      );

      if (!confirmInit) return;

      setInitLoading(true);
      setError(null);
      setSuccessMessage("");

      await initializeDatabase();

      setSuccessMessage("Base de niveles inicializada correctamente.");
    } catch (error) {
      console.error("Error initializing database:", error);
      setError(`No se pudo inicializar la base de datos: ${error.message}`);
    } finally {
      setInitLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "No disponible";

    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getCountryInfo = (countryCode) => {
    const country = countries.find((item) => item.code === countryCode);

    return country || {
      name: "No especificado",
      flag: "🌎"
    };
  };

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <FaSpinner className="animate-spin text-4xl text-primary-600 mb-4" />
      <p className="text-gray-600">Cargando datos...</p>
    </div>
  );

  const ErrorMessage = ({ message }) => (
    <div
      className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg"
      role="alert"
    >
      <strong className="font-bold">Error: </strong>
      <span>{message}</span>
    </div>
  );

  const SuccessMessage = ({ message }) => (
    <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
      {message}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        type="button"
        onClick={() => navigate("/home")}
        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium"
      >
        <FaArrowLeft />
        Volver al inicio
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Panel de Administración
        </h1>
        <p className="text-gray-600">
          Gestiona usuarios, lecciones, temas y tests del sistema.
        </p>
      </div>

      <AdminNavigationCards
        navigate={navigate}
        initLoading={initLoading}
        onInitializeDatabase={handleInitializeDatabase}
      />

      {error && <ErrorMessage message={error} />}
      {successMessage && <SuccessMessage message={successMessage} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <AdminUsersTable
          users={users}
          getCountryInfo={getCountryInfo}
          onSelectUser={setSelectedUser}
        />
      )}

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          updateLoading={updateLoading}
          currentUserId={auth.currentUser?.uid}
          getCountryInfo={getCountryInfo}
          formatDate={formatDate}
          onClose={() => setSelectedUser(null)}
          onRoleChange={handleRoleChange}
          onToggleForumBlock={handleToggleForumBlock}
          onDeleteUser={handleDeleteUser}
        />
      )}
    </div>
  );
};

export default Admin;