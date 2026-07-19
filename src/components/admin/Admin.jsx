// src/components/admin/Admin.jsx

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSpinner
} from "react-icons/fa";

import { auth, db } from "../../firebase";
import { countries } from "../../utils/countries";

import {
  deleteUserAccount,
  isUserAdmin,
  toggleUserForumBlock,
  updateUserRole
} from "../../services/auth/firestoreService";

import { initializeDatabase } from "../../services/database/initializeData";

import AdminNavigationCards from "./AdminNavigationCards";
import AdminUsersTable from "./AdminUsersTable";
import UserDetailsModal from "./UserDetailsModal";

const TEST_HISTORY_LIMIT = 3;

const toDate = (value) => {
  if (!value) return null;

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.getTime())
    ? null
    : parsedDate;
};

const getTestTimestamp = (test) => {
  const testDate = toDate(test?.testDate);

  return testDate?.getTime?.() || 0;
};

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
    let isMounted = true;

    const checkAdminAndLoadUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentUser = auth.currentUser;

        if (!currentUser) {
          navigate("/login", {
            replace: true
          });

          return;
        }

        if (!currentUser.emailVerified) {
          navigate("/verification-pending", {
            replace: true,
            state: {
              email: currentUser.email
            }
          });

          return;
        }

        const adminStatus = await isUserAdmin(currentUser.uid);

        if (!adminStatus) {
          navigate("/home", {
            replace: true
          });

          return;
        }

        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);

        const usersData = await Promise.all(
          usersSnapshot.docs.map(async (userDocument) => {
            const userData = userDocument.data();

            const testsRef = collection(db, "userTests");

            const testsQuery = query(
              testsRef,
              where("userId", "==", userDocument.id)
            );

            const testsSnapshot = await getDocs(testsQuery);

            const lastTests = testsSnapshot.docs
              .map((testDocument) => ({
                id: testDocument.id,
                ...testDocument.data()
              }))
              .filter((test) => test.completed === true)
              .sort(
                (testA, testB) =>
                  getTestTimestamp(testB) -
                  getTestTimestamp(testA)
              )
              .slice(0, TEST_HISTORY_LIMIT)
              .map((test) => ({
                id: test.id,
                date: toDate(test.testDate),
                score: Number(
                  test.results?.overallScore || 0
                ),
                level:
                  test.results?.placementLevel ||
                  test.results?.finalLevel ||
                  "N/A"
              }));

            return {
              id: userDocument.id,

              name: userData.name || "N/A",
              lastName: userData.lastName || "N/A",
              email: userData.email || "N/A",

              lastLogin: toDate(userData.lastLogin),

              country: userData.country || "",

              forumBlocked:
                userData.forumBlocked === true,

              role: userData.role || "user",

              ageGroup: userData.ageGroup || "all",

              emailVerified:
                userData.emailVerified === true,

              currentLevel:
                userData.currentLevel || "N/A",

              placementLevel:
                userData.placementLevel || "N/A",

              isActive:
                userData.isActive !== false,

              tests: lastTests
            };
          })
        );

        if (!isMounted) return;

        setUsers(usersData);
      } catch (error) {
        console.error(
          "Error loading admin data:",
          error
        );

        if (!isMounted) return;

        setError(
          "Nie udało się załadować danych. Spróbuj ponownie."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAdminAndLoadUsers();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleRoleChange = async (
    userId,
    newRole
  ) => {
    try {
      if (userId === auth.currentUser?.uid) {
        setError(
          "Nie możesz zmienić własnej roli z tego panelu."
        );

        return;
      }

      const confirmChange = window.confirm(
        `Czy na pewno chcesz zmienić rolę tego użytkownika na „${newRole}”?`
      );

      if (!confirmChange) return;

      setUpdateLoading((previousState) => ({
        ...previousState,
        [userId]: true
      }));

      setError(null);
      setSuccessMessage("");

      await updateUserRole(userId, newRole);

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                role: newRole
              }
            : user
        )
      );

      setSelectedUser((previousUser) =>
        previousUser?.id === userId
          ? {
              ...previousUser,
              role: newRole
            }
          : previousUser
      );

      setSuccessMessage(
        "Rola użytkownika została zaktualizowana."
      );
    } catch (error) {
      console.error(
        "Error updating user role:",
        error
      );

      setError(
        `Nie udało się zaktualizować roli użytkownika: ${error.message}`
      );
    } finally {
      setUpdateLoading((previousState) => ({
        ...previousState,
        [userId]: false
      }));
    }
  };

  const handleToggleForumBlock = async (
    userId,
    isCurrentlyBlocked
  ) => {
    try {
      if (userId === auth.currentUser?.uid) {
        setError(
          "Nie możesz zablokować własnego dostępu do forum."
        );

        return;
      }

      const nextBlockedState =
        !isCurrentlyBlocked;

      const confirmAction = window.confirm(
        nextBlockedState
          ? "Czy na pewno chcesz zablokować temu użytkownikowi dostęp do forum?"
          : "Czy na pewno chcesz odblokować temu użytkownikowi dostęp do forum?"
      );

      if (!confirmAction) return;

      setUpdateLoading((previousState) => ({
        ...previousState,
        [userId]: true
      }));

      setError(null);
      setSuccessMessage("");

      await toggleUserForumBlock({
        userId,
        blocked: nextBlockedState
      });

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                forumBlocked: nextBlockedState
              }
            : user
        )
      );

      setSelectedUser((previousUser) =>
        previousUser?.id === userId
          ? {
              ...previousUser,
              forumBlocked: nextBlockedState
            }
          : previousUser
      );

      setSuccessMessage(
        nextBlockedState
          ? "Dostęp użytkownika do forum został zablokowany."
          : "Dostęp użytkownika do forum został odblokowany."
      );
    } catch (error) {
      console.error(
        "Error updating forum access:",
        error
      );

      setError(
        `Nie udało się zaktualizować dostępu do forum: ${error.message}`
      );
    } finally {
      setUpdateLoading((previousState) => ({
        ...previousState,
        [userId]: false
      }));
    }
  };

  const handleDeleteUser = async (user) => {
    try {
      if (!user?.id) {
        setError("Nieprawidłowy użytkownik.");

        return;
      }

      if (user.id === auth.currentUser?.uid) {
        setError(
          "Nie możesz usunąć własnego konta z tego panelu."
        );

        return;
      }

      const userFullName = [
        user.name,
        user.lastName
      ]
        .filter(Boolean)
        .join(" ");

      const confirmDelete = window.confirm(
        `Czy na pewno chcesz usunąć użytkownika „${userFullName}”?

Ta operacja:
• usunie dokument użytkownika z Firestore
• usunie jego postęp widoczny w panelu administracyjnym
• NIE usunie jeszcze konta z Firebase Authentication

Tej operacji nie można cofnąć.`
      );

      if (!confirmDelete) return;

      setUpdateLoading((previousState) => ({
        ...previousState,
        [user.id]: true
      }));

      setError(null);
      setSuccessMessage("");

      await deleteUserAccount(user.id);

      setSelectedUser(null);

      setUsers((previousUsers) =>
        previousUsers.filter(
          (item) => item.id !== user.id
        )
      );

      setSuccessMessage(
        "Użytkownik został usunięty z Firestore."
      );
    } catch (error) {
      console.error(
        "Error deleting user:",
        error
      );

      setError(
        `Nie udało się usunąć użytkownika: ${error.message}`
      );
    } finally {
      if (user?.id) {
        setUpdateLoading((previousState) => ({
          ...previousState,
          [user.id]: false
        }));
      }
    }
  };

  const handleInitializeDatabase = async () => {
    try {
      const confirmInitialization =
        window.confirm(
          "Czy chcesz zainicjalizować lub zaktualizować podstawową strukturę poziomów?"
        );

      if (!confirmInitialization) return;

      setInitLoading(true);
      setError(null);
      setSuccessMessage("");

      await initializeDatabase();

      setSuccessMessage(
        "Podstawowa struktura poziomów została zainicjalizowana."
      );
    } catch (error) {
      console.error(
        "Error initializing database:",
        error
      );

      setError(
        `Nie udało się zainicjalizować bazy danych: ${error.message}`
      );
    } finally {
      setInitLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "Brak danych";
    }

    return date.toLocaleString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getCountryInfo = (countryCode) => {
    const country = countries.find(
      (item) => item.code === countryCode
    );

    return (
      country || {
        name: "Nie określono",
        flag: "🌎"
      }
    );
  };

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <FaSpinner className="animate-spin text-4xl text-primary-600 mb-4" />

      <p className="text-gray-600">
        Ładowanie danych...
      </p>
    </div>
  );

  const ErrorMessage = ({ message }) => (
    <div
      className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg"
      role="alert"
    >
      <strong className="font-bold">
        Błąd:{" "}
      </strong>

      <span>{message}</span>
    </div>
  );

  const SuccessMessage = ({ message }) => (
    <div
      className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg"
      role="status"
    >
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

        Powrót do strony głównej
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Panel administracyjny
        </h1>

        <p className="text-gray-600">
          Zarządzaj użytkownikami, lekcjami, tematami i testami systemu.
        </p>
      </div>

      <AdminNavigationCards
        navigate={navigate}
        initLoading={initLoading}
        onInitializeDatabase={
          handleInitializeDatabase
        }
      />

      {error && (
        <ErrorMessage message={error} />
      )}

      {successMessage && (
        <SuccessMessage
          message={successMessage}
        />
      )}

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
          onToggleForumBlock={
            handleToggleForumBlock
          }
          onDeleteUser={handleDeleteUser}
        />
      )}
    </div>
  );
};

export default Admin;