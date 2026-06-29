// src/components/profile/EditProfileModal.jsx

import { useEffect, useState } from "react";
import { FaSave, FaTimes } from "react-icons/fa";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { countries } from "../../utils/countries";

const EditProfileModal = ({ userId, userData, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    age: "",
    country: ""
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userData) return;

    setFormData({
      name: userData.name || "",
      lastName: userData.lastName || "",
      age: userData.age || "",
      country: userData.country || ""
    });
  }, [userData]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const getAgeGroup = (age) => {
    const numericAge = Number(age);

    if (!numericAge || numericAge < 13) return "children";
    if (numericAge < 18) return "teens";
    return "adults";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userId) {
      alert("No se encontró el usuario autenticado.");
      return;
    }

    if (!formData.name.trim() || !formData.lastName.trim()) {
      alert("Nombre y apellido son obligatorios.");
      return;
    }

    try {
      setSaving(true);

      const userRef = doc(db, "users", userId);

      const updatedData = {
        name: formData.name.trim(),
        lastName: formData.lastName.trim(),
        age: Number(formData.age) || null,
        ageGroup: getAgeGroup(formData.age),
        country: formData.country || "",
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, updatedData);

      if (onSaved) {
        onSaved(updatedData);
      }

      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("No se pudo actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-3 sm:px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <header className="bg-primary-600 text-white px-5 md:px-6 py-4 md:py-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-primary-100 text-xs md:text-sm font-semibold uppercase tracking-wide">
              Profile settings
            </p>

            <h2 className="text-xl md:text-2xl font-bold mt-1">
              Edit profile
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0"
            disabled={saving}
          >
            <FaTimes />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="p-5 md:p-6 space-y-4 md:space-y-5 overflow-y-auto"
        >
          <div className="grid md:grid-cols-2 gap-4 md:gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Last name
              </label>

              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Your last name"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Age
              </label>

              <input
                type="number"
                name="age"
                min="1"
                max="120"
                value={formData.age}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Age"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Country
              </label>

              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">Select country</option>

                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-2xl p-4 text-xs md:text-sm">
            Updating your age may adjust your learning group and the lessons
            available for your profile.
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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              <FaSave />
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;