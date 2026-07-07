// src/components/profile/ProfileTestHistory.jsx

import {
  FaCheckCircle,
  FaHistory,
  FaTimesCircle
} from "react-icons/fa";

const formatDate = (timestamp) => {
  if (!timestamp?.toDate) return "Brak danych";
  return timestamp.toDate().toLocaleDateString("pl-PL");
};

const ProfileTestHistory = ({ testHistory = [] }) => {
  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-4 md:p-8">
      <div className="flex items-center gap-3 mb-5 md:mb-6">
        <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-lg md:text-xl shrink-0">
          <FaHistory />
        </div>

        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Historia testów
          </h2>

          <p className="text-xs md:text-sm text-gray-500">
            Wyniki Twoich wcześniejszych testów.
          </p>
        </div>
      </div>

      {testHistory.length === 0 ? (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 md:p-8 text-center text-gray-600 text-sm md:text-base">
          Brak dostępnej historii testów.
        </div>
      ) : (
        <>
          <div className="block md:hidden space-y-3">
            {testHistory.map((test) => {
              const score = Math.round(test.results?.overallScore || 0);
              const passed = score >= 70;

              return (
                <article
                  key={test.id}
                  className="bg-gray-50 border border-gray-100 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Data</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(test.testDate)}
                      </p>
                    </div>

                    <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold">
                      {test.results?.finalLevel || "Nie określono"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl border border-gray-100 p-3">
                      <p className="text-xs text-gray-500">Wynik</p>
                      <p className="font-bold text-gray-900">{score}%</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-3">
                      <p className="text-xs text-gray-500">Rezultat</p>

                      <span
                        className={`inline-flex items-center gap-1 mt-1 text-xs font-semibold ${
                          passed ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {passed ? <FaCheckCircle /> : <FaTimesCircle />}
                        {passed ? "Zaliczony" : "Niezaliczony"}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Data
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Poziom
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Wynik
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Rezultat
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {testHistory.map((test) => {
                  const score = Math.round(test.results?.overallScore || 0);
                  const passed = score >= 70;

                  return (
                    <tr
                      key={test.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4 whitespace-nowrap text-gray-700">
                        {formatDate(test.testDate)}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {test.results?.finalLevel || "Nie określono"}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-gray-900">
                          {score}%
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                            passed
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {passed ? <FaCheckCircle /> : <FaTimesCircle />}
                          {passed ? "Zaliczony" : "Niezaliczony"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};

export default ProfileTestHistory;