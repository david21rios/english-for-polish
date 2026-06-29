// src/components/AdminTemas.jsx

import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEdit, FaTrash, FaPlus, FaTimes } from "react-icons/fa";

import { db } from "../../firebase";
import { iconOptions } from "../../utils/iconOptions";

const INITIAL_THEME = {
  icon: "",
  title: "",
  description: "",
  numero: ""
};

const AdminTemas = () => {
  const navigate = useNavigate();

  const [temas, setTemas] = useState([]);
  const [nuevoTema, setNuevoTema] = useState(INITIAL_THEME);
  const [editandoId, setEditandoId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const cargarTemas = async () => {
    try {
      setLoading(true);
      setError("");

      const snapshot = await getDocs(collection(db, "temas"));

      const data = snapshot.docs
        .map((document) => ({
          id: document.id,
          ...document.data()
        }))
        .sort((a, b) => (Number(a.numero) || 0) - (Number(b.numero) || 0));

      setTemas(data);
    } catch (error) {
      console.error("Error loading topics:", error);
      setError("Error al cargar los temas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTemas();
  }, []);

  const resetForm = () => {
    setNuevoTema(INITIAL_THEME);
    setEditandoId(null);
    setError("");
    setSuccessMessage("");
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setNuevoTema((prev) => ({
      ...prev,
      [name]: name === "numero" ? value : value
    }));
  };

  const handleIconChange = (event) => {
    setNuevoTema((prev) => ({
      ...prev,
      icon: event.target.value
    }));
  };

  const validarTema = () => {
    const numero = Number(nuevoTema.numero);

    if (!nuevoTema.title.trim()) {
      return "El título del tema es obligatorio.";
    }

    if (!nuevoTema.icon) {
      return "Debes seleccionar un icono.";
    }

    if (!nuevoTema.description.trim()) {
      return "La descripción del tema es obligatoria.";
    }

    if (!Number.isInteger(numero) || numero <= 0) {
      return "El número del tema debe ser un entero mayor que 0.";
    }

    return "";
  };

  const guardarTema = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const validationError = validarTema();

      if (validationError) {
        setError(validationError);
        return;
      }

      const topicData = {
        icon: nuevoTema.icon,
        title: nuevoTema.title.trim(),
        description: nuevoTema.description.trim(),
        numero: Number(nuevoTema.numero),
        updatedAt: serverTimestamp()
      };

      if (editandoId) {
        const topicRef = doc(db, "temas", editandoId);
        await updateDoc(topicRef, topicData);
        setSuccessMessage("Tema actualizado correctamente.");
      } else {
        await addDoc(collection(db, "temas"), {
          ...topicData,
          createdAt: serverTimestamp()
        });
        setSuccessMessage("Tema creado correctamente.");
      }

      resetForm();
      await cargarTemas();
    } catch (error) {
      console.error("Error saving topic:", error);
      setError("Error al guardar el tema. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  const editarTema = (tema) => {
    setNuevoTema({
      icon: tema.icon || "",
      title: tema.title || "",
      description: tema.description || "",
      numero: tema.numero || ""
    });

    setEditandoId(tema.id);
    setError("");
    setSuccessMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminarTema = async (tema) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar el tema "${tema.title}"?`
    );

    if (!confirmar) return;

    try {
      setError("");
      setSuccessMessage("");

      await deleteDoc(doc(db, "temas", tema.id));

      setSuccessMessage("Tema eliminado correctamente.");
      await cargarTemas();
    } catch (error) {
      console.error("Error deleting topic:", error);
      setError("Error al eliminar el tema.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <button
        type="button"
        onClick={() => navigate("/admin")}
        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium"
      >
        <FaArrowLeft />
        Volver al panel admin
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {editandoId ? "Editar Tema" : "Gestión de Temas"}
        </h1>

        <p className="text-gray-600 mt-2">
          Administra los temas principales que verá el estudiante en la sección
          interactiva.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl">
          {successMessage}
        </div>
      )}

      <form
        onSubmit={guardarTema}
        className="mb-10 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Icono del tema
          </label>

          <select
            name="icon"
            value={nuevoTema.icon}
            onChange={handleIconChange}
            className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          >
            <option value="">Selecciona un icono...</option>

            {iconOptions.map((option, index) => (
              <option key={`${option.icon}_${index}`} value={option.icon}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número
            </label>

            <input
              type="number"
              name="numero"
              min="1"
              value={nuevoTema.numero}
              onChange={handleInputChange}
              placeholder="Ej: 1"
              className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título
            </label>

            <input
              type="text"
              name="title"
              value={nuevoTema.title}
              onChange={handleInputChange}
              placeholder="Título del tema"
              className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>

          <textarea
            name="description"
            value={nuevoTema.description}
            onChange={handleInputChange}
            placeholder="Descripción del tema"
            className="w-full border rounded-xl px-4 py-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50"
          >
            {editandoId ? <FaEdit /> : <FaPlus />}
            {saving
              ? "Guardando..."
              : editandoId
              ? "Actualizar tema"
              : "Crear tema"}
          </button>

          {editandoId && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 disabled:opacity-50"
            >
              <FaTimes />
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : temas.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
          No hay temas creados todavía.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {temas.map((tema) => (
            <div
              key={tema.id}
              className="bg-white rounded-2xl p-5 shadow border border-gray-100 flex flex-col sm:flex-row justify-between gap-4"
            >
              <div className="flex gap-4 items-start min-w-0">
                <div className="text-4xl shrink-0">{tema.icon}</div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-1">
                    Tema #{tema.numero || "N/A"}
                  </p>

                  <h3 className="font-bold text-lg text-gray-900 break-words">
                    {tema.title}
                  </h3>

                  <p className="text-gray-600 text-sm mt-1 break-words">
                    {tema.description}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col gap-2 sm:items-end">
                <button
                  type="button"
                  onClick={() => editarTema(tema)}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <FaEdit />
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => eliminarTema(tema)}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTemas;