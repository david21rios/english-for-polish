// src/components/profile/ProfileProgress.jsx

import {
  FaBookOpen,
  FaChartLine,
  FaClock,
  FaRocket
} from "react-icons/fa";

const getNextTestDate = (lastTestDate) => {
  if (!lastTestDate?.toDate) return "Dostępny teraz";

  const lastDate = lastTestDate.toDate();
  const nextDate = new Date(lastDate);

  nextDate.setDate(nextDate.getDate() + 20);

  return nextDate <= new Date()
    ? "Dostępny teraz"
    : nextDate.toLocaleDateString("pl-PL");
};

const normalizeCurrentLevel = (level = "A1") => {
  return level?.toString().split("-")[0] || "A1";
};

const ProfileProgress = ({
  userData,
  testHistory = [],
  levelProgress = null
}) => {
  const currentLevel = normalizeCurrentLevel(
    userData?.currentLevel ||
      userData?.level ||
      userData?.finalLevel ||
      "A1"
  );

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
      title: "Ukończone lekcje",
      value: `${completedLessons} / ${totalLessons}`,
      description: `Ukończone lekcje na poziomie ${currentLevel}.`,
      icon: <FaBookOpen />,
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Pozostałe lekcje",
      value: pendingLessons,
      description: "Lekcje pozostałe na aktualnym poziomie.",
      icon: <FaChartLine />,
      color: "bg-primary-100 text-primary-600"
    },
    {
      title: "Ostatni wynik",
      value: testsCompleted > 0 ? `${lastScore}%` : "Oczekuje",
      description: "Najnowszy wynik testu diagnostycznego.",
      icon: <FaRocket />,
      color: "bg-green-100 text-green-700"
    },
    {
      title: "Następny test",
      value: nextTestDate,
      description: "Najbliższa dostępna data testu diagnostycznego.",
      icon: <FaClock />,
      color: "bg-yellow-100 text-yellow-700"
    }
  ];

  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-4 md:p-8">
      <div className="mb-5 md:mb-8">
        <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
          Postęp w nauce
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">
          Postęp na poziomie {currentLevel}
        </h2>

        <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed">
          Postęp jest obliczany na podstawie ukończonych lekcji na aktualnym
          poziomie.
        </p>
      </div>

      <div className="mb-5 md:mb-8">
        <div className="flex justify-between gap-3 text-xs md:text-sm text-gray-600 mb-2">
          <span className="break-words">
            Ukończone lekcje: {completedLessons} z {totalLessons}
          </span>

          <span className="font-semibold shrink-0">{progressPercent}%</span>
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

            <p className="text-xs md:text-sm text-gray-500">{card.title}</p>

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