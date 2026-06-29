// src/components/admin/AdminUsersTable.jsx

import { useMemo, useState } from "react";
import {
  FaChevronDown,
  FaFilter,
  FaSearch,
  FaTimes,
  FaUsers
} from "react-icons/fa";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const AdminUsersTable = ({
  users = [],
  getCountryInfo,
  onSelectUser
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const getLastTest = (user) => {
    return user.tests?.length > 0 ? user.tests[0] : null;
  };

  const getUserLevel = (user) => {
    return user.currentLevel || user.placementLevel || "N/A";
  };

  const getUserScore = (user) => {
    const lastTest = getLastTest(user);
    return lastTest ? `${Math.round(lastTest.score || 0)}%` : "N/A";
  };

  const getRoleClass = (role) => {
    return role === "admin"
      ? "bg-primary-100 text-primary-700"
      : "bg-gray-100 text-gray-700";
  };

  const availableCountries = useMemo(() => {
    const countryCodes = users
      .map((user) => user.country)
      .filter(Boolean);

    return [...new Set(countryCodes)].sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const fullName = `${user.name || ""} ${user.lastName || ""}`
        .toLowerCase()
        .trim();

      const email = (user.email || "").toLowerCase();
      const role = user.role || "user";
      const country = user.country || "";
      const level = getUserLevel(user);

      const matchesSearch =
        !normalizedSearch ||
        fullName.includes(normalizedSearch) ||
        email.includes(normalizedSearch);

      const matchesRole =
        roleFilter === "all" || role === roleFilter;

      const matchesCountry =
        countryFilter === "all" || country === countryFilter;

      const matchesLevel =
        levelFilter === "all" || level === levelFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesCountry &&
        matchesLevel
      );
    });
  }, [users, searchTerm, roleFilter, countryFilter, levelFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setCountryFilter("all");
    setLevelFilter("all");
  };

  const hasActiveFilters =
    searchTerm.trim() ||
    roleFilter !== "all" ||
    countryFilter !== "all" ||
    levelFilter !== "all";

  if (!users.length) {
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <FaUsers className="text-primary-600 text-3xl mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900">
          No hay usuarios registrados
        </h2>
        <p className="text-gray-500 mt-2">
          Cuando existan usuarios, aparecerán en esta tabla.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-5 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-gray-700">
            <FaUsers className="text-primary-600" />
            <span className="font-semibold">
              Usuarios: {filteredUsers.length} de {users.length}
            </span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
            >
              <FaTimes />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full border border-gray-300 rounded-2xl pl-11 pr-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
                
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className="inline-flex items-center justify-center gap-2 border border-gray-300 rounded-2xl px-5 py-3 text-sm md:text-base font-semibold text-gray-700 hover:bg-gray-50"
          >
            <FaFilter />
            Filtros
            <FaChevronDown
              className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </button>
        </div>
                
        {showFilters && (
          <div className="mt-4 bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Todos los roles</option>
                <option value="admin">Administradores</option>
                <option value="user">Usuarios</option>
              </select>
        
              <select
                value={countryFilter}
                onChange={(event) => setCountryFilter(event.target.value)}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Todos los países</option>
        
                {availableCountries.map((countryCode) => {
                  const countryInfo = getCountryInfo(countryCode);
                
                  return (
                    <option key={countryCode} value={countryCode}>
                      {countryInfo.flag} {countryInfo.name}
                    </option>
                  );
                })}
              </select>
              
              <select
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.target.value)}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Todos los niveles</option>
              
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
              
            <div className="mt-3 flex items-start gap-2 text-xs md:text-sm text-gray-500">
              <FaFilter className="mt-0.5 shrink-0" />
              <p>
                Los filtros se aplican sobre los usuarios cargados actualmente en el
                panel.
              </p>
            </div>
          </div>
        )}
      </section>

      {filteredUsers.length === 0 ? (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <FaUsers className="text-gray-400 text-3xl mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900">
            No hay usuarios que coincidan
          </h2>
          <p className="text-gray-500 mt-2">
            Cambia los filtros o limpia la búsqueda.
          </p>
        </section>
      ) : (
        <>
          <div className="block lg:hidden space-y-3">
            {filteredUsers.map((user) => {
              const countryInfo = getCountryInfo(user.country);

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onSelectUser(user)}
                  className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900">
                        {user.name} {user.lastName}
                      </h3>

                      <p className="text-sm text-gray-500 break-all">
                        {user.email}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize shrink-0 ${getRoleClass(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Level</p>
                      <p className="font-semibold">{getUserLevel(user)}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">Score</p>
                      <p className="font-semibold">{getUserScore(user)}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">Country</p>
                      <p className="font-semibold">
                        {countryInfo.flag} {countryInfo.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Role</p>
                      <p className="font-semibold capitalize">{user.role}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:block bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Level
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Score
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Country
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => {
                    const countryInfo = getCountryInfo(user.country);

                    return (
                      <tr
                        key={user.id}
                        onClick={() => onSelectUser(user)}
                        className="hover:bg-primary-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {user.name} {user.lastName}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {user.email}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {getUserLevel(user)}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {getUserScore(user)}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {countryInfo.flag} {countryInfo.name}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRoleClass(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AdminUsersTable;