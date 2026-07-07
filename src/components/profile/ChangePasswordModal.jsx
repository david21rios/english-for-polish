// src/components/profile/ChangePasswordModal.jsx

import { useEffect, useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "firebase/auth";
import { FaLock, FaSave, FaTimes } from "react-icons/fa";
import { auth } from "../../firebase";

const ChangePasswordModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [saving, setSaving] = useState(false);

  const closeModal = () => {
    if (!saving) onClose?.();
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [saving]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.currentPassword.trim()) return "Aktualne hasło jest wymagane.";
    if (formData.newPassword.length < 6) return "Nowe hasło musi mieć co najmniej 6 znaków.";
    if (formData.newPassword !== formData.confirmPassword) return "Nowe hasło i potwierdzenie nie są takie same.";
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    const user = auth.currentUser;

    if (!user?.email) {
      alert("Nie znaleziono zalogowanego użytkownika.");
      return;
    }

    try {
      setSaving(true);

      const credential = EmailAuthProvider.credential(
        user.email,
        formData.currentPassword
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, formData.newPassword);

      alert("Hasło zostało zaktualizowane.");
      onClose?.();
    } catch (error) {
      console.error("Error changing password:", error);

      if (error.code === "auth/wrong-password") {
        alert("Aktualne hasło jest nieprawidłowe.");
      } else if (error.code === "auth/too-many-requests") {
        alert("Zbyt wiele prób. Spróbuj ponownie później.");
      } else if (error.code === "auth/requires-recent-login") {
        alert("Wyloguj się i zaloguj ponownie przed zmianą hasła.");
      } else {
        alert("Nie udało się zaktualizować hasła.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center px-3 sm:px-4"
      onMouseDown={closeModal}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="bg-yellow-500 text-white px-5 md:px-6 py-4 md:py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-yellow-100 text-xs md:text-sm font-semibold uppercase tracking-wide">
              Bezpieczeństwo konta
            </p>

            <h2 className="text-xl md:text-2xl font-bold mt-1">
              Zmień hasło
            </h2>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0"
            aria-label="Zamknij okno"
          >
            <FaTimes />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5 overflow-y-auto">
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-2xl px-4 py-3"
            placeholder="Wpisz aktualne hasło"
          />

          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-2xl px-4 py-3"
            placeholder="Minimum 6 znaków"
          />

          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-2xl px-4 py-3"
            placeholder="Powtórz nowe hasło"
          />

          <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-2xl p-4 text-sm flex gap-3">
            <FaLock className="mt-1 shrink-0" />
            <p>Firebase wymaga aktualnego hasła przed jego zmianą.</p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-6 py-3 rounded-2xl border border-gray-300 font-semibold"
            >
              Anuluj
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-yellow-500 text-white font-semibold disabled:opacity-50"
            >
              <FaSave />
              {saving ? "Zapisywanie..." : "Zaktualizuj hasło"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;