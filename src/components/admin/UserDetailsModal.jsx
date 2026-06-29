// src/components/admin/UserDetailsModal.jsx

import {
  FaBan,
  FaCheckCircle,
  FaEnvelope,
  FaGlobeAmericas,
  FaGraduationCap,
  FaSpinner,
  FaTimes,
  FaTrash,
  FaUser,
  FaUserShield
} from "react-icons/fa";

const UserDetailsModal = ({
  user,
  updateLoading = {},
  onClose,
  onRoleChange,
  onToggleForumBlock,
  onDeleteUser,
  formatDate,
  getCountryInfo,
  currentUserId
}) => {
  if (!user) return null;

  const countryInfo = getCountryInfo(user.country);
  const isCurrentUser = user.id === currentUserId;
  const isForumBlocked = user.forumBlocked === true;
  const isLoading = updateLoading[user.id] === true;

  const lastTest = user.tests?.[0] || null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-3 sm:px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        <header className="bg-primary-600 text-white px-5 md:px-6 py-4 md:py-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl shrink-0">
              {user.role === "admin" ? <FaUserShield /> : <FaUser />}
            </div>

            <div className="min-w-0">
              <p className="text-xs md:text-sm uppercase tracking-wide text-primary-100 font-semibold">
                User details
              </p>

              <h2 className="text-xl md:text-2xl font-bold mt-1 break-words">
                {user.name} {user.lastName}
              </h2>

              <p className="text-sm text-primary-100 break-all mt-1">
                {user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0"
            aria-label="Close user details"
          >
            <FaTimes />
          </button>
        </header>

        <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-5">
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <FaGraduationCap className="text-blue-600 mb-2" />
              <p className="text-xs text-gray-500">Current level</p>
              <p className="font-bold text-gray-900">
                {user.currentLevel || user.placementLevel || "N/A"}
              </p>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <FaCheckCircle className="text-green-600 mb-2" />
              <p className="text-xs text-gray-500">Last score</p>
              <p className="font-bold text-gray-900">
                {lastTest ? `${Math.round(lastTest.score || 0)}%` : "N/A"}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
              <FaGlobeAmericas className="text-yellow-700 mb-2" />
              <p className="text-xs text-gray-500">Country</p>
              <p className="font-bold text-gray-900">
                {countryInfo.flag} {countryInfo.name}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
              <FaUserShield className="text-purple-600 mb-2" />
              <p className="text-xs text-gray-500">Role</p>
              <p className="font-bold text-gray-900 capitalize">
                {user.role || "user"}
              </p>
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-5">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <h3 className="font-bold text-gray-900 mb-4">
                Personal information
              </h3>

              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  <strong>Name:</strong> {user.name} {user.lastName}
                </p>

                <p className="break-all">
                  <strong>Email:</strong> {user.email}
                </p>

                <p>
                  <strong>Country:</strong> {countryInfo.flag}{" "}
                  {countryInfo.name}
                </p>

                <p>
                  <strong>Age group:</strong> {user.ageGroup || "N/A"}
                </p>

                <p>
                  <strong>Email verified:</strong>{" "}
                  {user.emailVerified ? "Yes" : "No"}
                </p>

                <p>
                  <strong>Last login:</strong> {formatDate(user.lastLogin)}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {user.isActive === false ? (
                    <span className="text-red-600 font-semibold">
                      Inactive
                    </span>
                  ) : (
                    <span className="text-green-600 font-semibold">
                      Active
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <h3 className="font-bold text-gray-900 mb-4">
                Learning information
              </h3>

              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  <strong>Current level:</strong>{" "}
                  {user.currentLevel || "N/A"}
                </p>

                <p>
                  <strong>Placement level:</strong>{" "}
                  {user.placementLevel || "N/A"}
                </p>

                <p>
                  <strong>Last test score:</strong>{" "}
                  {lastTest ? `${Math.round(lastTest.score || 0)}%` : "N/A"}
                </p>

                <p>
                  <strong>Last test level:</strong>{" "}
                  {lastTest?.level || "N/A"}
                </p>

                <p>
                  <strong>Forum access:</strong>{" "}
                  {isForumBlocked ? (
                    <span className="text-red-600 font-semibold">
                      Blocked
                    </span>
                  ) : (
                    <span className="text-green-600 font-semibold">
                      Allowed
                    </span>
                  )}
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white border border-gray-100 rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 mb-4">
              Recent tests
            </h3>

            {user.tests?.length > 0 ? (
              <div className="space-y-3">
                {user.tests.map((test, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-50 rounded-xl p-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        Level {test.level || "N/A"}
                      </p>

                      <p className="text-gray-500">
                        {formatDate(test.date)}
                      </p>
                    </div>

                    <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-semibold w-fit">
                      {Math.round(test.score || 0)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No tests completed yet.
              </p>
            )}
          </section>

          <section className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 mb-4">
              Administration actions
            </h3>

            {isLoading ? (
              <div className="flex items-center gap-3 text-primary-600">
                <FaSpinner className="animate-spin" />
                Updating user...
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>

                  <select
                    value={user.role || "user"}
                    onChange={(event) =>
                      onRoleChange(user.id, event.target.value)
                    }
                    disabled={isCurrentUser}
                    className="w-full border border-gray-300 rounded-xl px-3 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() =>
                      onToggleForumBlock(user.id, isForumBlocked)
                    }
                    disabled={isCurrentUser}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                      isForumBlocked
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {isForumBlocked ? <FaCheckCircle /> : <FaBan />}
                    {isForumBlocked ? "Unblock forum" : "Block forum"}
                  </button>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => onDeleteUser?.(user)}
                    disabled={isCurrentUser}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaTrash />
                    Delete user
                  </button>
                </div>
              </div>
            )}

            {isCurrentUser && (
              <p className="text-xs text-gray-500 mt-3">
                You cannot change your own role, block yourself, or delete your
                own account from this panel.
              </p>
            )}
          </section>
        </div>

        <footer className="border-t border-gray-100 p-4 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};

export default UserDetailsModal;