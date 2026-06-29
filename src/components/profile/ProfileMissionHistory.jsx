//src/components/profile/ProfileMissionHistory.jsx
import {
  FaBullseye,
  FaCheckCircle,
  FaGamepad,
  FaStar
} from "react-icons/fa";

const formatDate = (dateValue) => {
  if (!dateValue) return "No date";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "No date";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const ProfileMissionHistory = ({ missionHistory = [] }) => {
  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-5 md:p-8 mb-6 md:mb-8">
      <div className="mb-5 md:mb-6">
        <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
          Mission history
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
          Your recent missions
        </h2>

        <p className="text-sm md:text-base text-gray-600 mt-2">
          Review your latest topic missions, scores, XP and progress.
        </p>
      </div>

      {missionHistory.length === 0 ? (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-center">
          <FaGamepad className="text-3xl text-gray-400 mx-auto mb-3" />

          <p className="text-gray-600 text-sm md:text-base">
            You have not completed any missions yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {missionHistory.map((mission, index) => (
            <article
              key={`${mission.topicId}_${mission.missionId}_${index}`}
              className="bg-gray-50 border border-gray-100 rounded-2xl p-4 md:p-5"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary-100 text-primary-600">
                      <FaBullseye />
                    </span>

                    <div>
                      <h3 className="font-bold text-gray-900 text-base md:text-lg break-words">
                        {mission.missionTitle || "Mission completed"}
                      </h3>

                      <p className="text-xs md:text-sm text-gray-500">
                        {mission.topicTitle || mission.topicId || "Topic"} ·{" "}
                        {formatDate(mission.completedAt)}
                      </p>
                    </div>
                  </div>

                  {mission.isCustomMission && (
                    <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                      Personalized mission
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 md:min-w-[260px]">
                  <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                    <p className="text-xs text-gray-500">Score</p>
                    <p className="font-bold text-gray-900">
                      {mission.score || 0}%
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                    <p className="text-xs text-gray-500">Stars</p>
                    <p className="font-bold text-yellow-600 inline-flex items-center justify-center gap-1">
                      <FaStar />
                      {mission.stars || 0}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                    <p className="text-xs text-gray-500">XP</p>
                    <p className="font-bold text-green-700">
                      +{mission.xpEarned || 0}
                    </p>
                  </div>
                </div>
              </div>

              {mission.passed && (
                <div className="mt-4 inline-flex items-center gap-2 text-green-700 text-sm font-semibold">
                  <FaCheckCircle />
                  Mission passed
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProfileMissionHistory;