// src/components/profile/ProfileProgress.jsx

import {
  FaBookOpen,
  FaChartLine,
  FaClock,
  FaRocket
} from "react-icons/fa";

const getNextTestDate = (lastTestDate) => {
  if (!lastTestDate?.toDate) return "Disponible ahora";

  const lastDate = lastTestDate.toDate();
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + 20);

  return nextDate <= new Date()
    ? "Disponible ahora"
    : nextDate.toLocaleDateString();
};

const ProfileProgress = ({
  userData,
  testHistory = [],
  levelProgress = null
}) => {
  const currentLevel = userData?.currentLevel || "A1-A2";

  const totalLessons = levelProgress?.totalLessons || 0;
  const completedLessons = levelProgress?.completedLessons || 0;
  const pendingLessons = levelProgress?.pendingLessons || 0;
  const progressPercent = levelProgress?.progressPercent || 0;

  const testsCompleted = testHistory.length;
  const lastTest = testHistory[0] || null;
  const lastScore = Math.round(lastTest?.results?.overallScore || 0);
  const nextTestDate = getNextTestDate(userData?.lastTestDate);

  const statusCards = [
    {
      title: "Completed lessons",
      value: `${completedLessons} / ${totalLessons}`,
      description: `Completed lessons in ${currentLevel}.`,
      icon: <FaBookOpen />,
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Pending lessons",
      value: pendingLessons,
      description: "Lessons remaining in your current level.",
      icon: <FaChartLine />,
      color: "bg-primary-100 text-primary-600"
    },
    {
      title: "Last score",
      value: testsCompleted > 0 ? `${lastScore}%` : "Pending",
      description: "Most recent diagnostic test result.",
      icon: <FaRocket />,
      color: "bg-green-100 text-green-700"
    },
    {
      title: "Next test",
      value: nextTestDate,
      description: "Next available diagnostic test date.",
      icon: <FaClock />,
      color: "bg-yellow-100 text-yellow-700"
    }
  ];

  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-4 md:p-8">
      <div className="mb-5 md:mb-8">
        <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
          Learning progress
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">
          Progress in {currentLevel}
        </h2>

        <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed">
          Your progress is calculated from completed lessons in your current
          level.
        </p>
      </div>

      <div className="mb-5 md:mb-8">
        <div className="flex justify-between gap-3 text-xs md:text-sm text-gray-600 mb-2">
          <span className="break-words">
            Lessons completed: {completedLessons} of {totalLessons}
          </span>

          <span className="font-semibold shrink-0">
            {progressPercent}%
          </span>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-3 md:h-4 overflow-hidden">
          <div
            className="h-3 md:h-4 bg-gradient-to-r from-primary-600 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5">
        {statusCards.map((card) => (
          <div
            key={card.title}
            className="bg-gray-50 rounded-2xl border border-gray-100 p-4 md:p-5"
          >
            <div
              className={`w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-lg md:text-xl mb-3 md:mb-4 ${card.color}`}
            >
              {card.icon}
            </div>

            <p className="text-xs md:text-sm text-gray-500">
              {card.title}
            </p>

            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-1 break-words">
              {card.value}
            </h3>

            <p className="text-xs md:text-sm text-gray-600 mt-2 leading-relaxed">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProfileProgress;