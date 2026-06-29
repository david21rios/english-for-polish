// src/components/profile/ChangePasswordModal.jsx

import { useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "firebase/auth";
import {
  FaLock,
  FaSave,
  FaTimes
} from "react-icons/fa";
import { auth } from "../../firebase";

const ChangePasswordModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword.trim()) {
      return "Current password is required.";
    }

    if (formData.newPassword.length < 6) {
      return "New password must be at least 6 characters.";
    }

    if (formData.newPassword !== formData.confirmPassword) {
      return "New password and confirmation do not match.";
    }

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

    if (!user || !user.email) {
      alert("No authenticated user found.");
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

      alert("Password updated successfully.");
      onClose();
    } catch (error) {
      console.error("Error changing password:", error);

      if (error.code === "auth/wrong-password") {
        alert("The current password is incorrect.");
        return;
      }

      if (error.code === "auth/too-many-requests") {
        alert("Too many attempts. Please try again later.");
        return;
      }

      if (error.code === "auth/requires-recent-login") {
        alert("Please log out and log in again before changing your password.");
        return;
      }

      alert("Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-3 sm:px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col">
        <header className="bg-yellow-500 text-white px-5 md:px-6 py-4 md:py-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-yellow-100 text-xs md:text-sm font-semibold uppercase tracking-wide">
              Account security
            </p>

            <h2 className="text-xl md:text-2xl font-bold mt-1">
              Change password
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0"
          >
            <FaTimes />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="p-5 md:p-6 space-y-4 md:space-y-5 overflow-y-auto"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Current password
            </label>

            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New password
            </label>

            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm new password
            </label>

            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Repeat new password"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-2xl p-4 text-xs md:text-sm flex gap-3">
            <FaLock className="mt-1 shrink-0" />
            <p>
              For security, Firebase requires your current password before
              updating it.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 md:pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-yellow-500 text-white font-semibold hover:bg-yellow-600 disabled:opacity-50"
            >
              <FaSave />
              {saving ? "Saving..." : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;