// src/components/profile/ProfileStats.jsx

import {
  FaGraduationCap,
  FaClipboardCheck,
  FaTrophy,
  FaChartLine
} from "react-icons/fa";

const normalizeCurrentLevel = (level = "A1") => {
  return level?.toString().split("-")[0] || "A1";
};

const ProfileStats = ({ userData, testHistory = [] }) => {
  const testsCompleted = testHistory.length;
  const currentLevel = normalizeCurrentLevel(
    userData?.currentLevel ||
    userData?.level ||
    userData?.finalLevel ||
    "A1"
  );

  const averageScore =
    testsCompleted > 0
      ? Math.round(
          testHistory.reduce((acc, test) => {
            const scores = Object.values(test.levelResults || {});

            if (!scores.length) return acc;

            const average =
              scores.reduce((total, score) => total + score, 0) / scores.length;

            return acc + average;
          }, 0) / testsCompleted
        )
      : 0;

  const xp = testsCompleted * 100 + averageScore * 10;

  const cards = [
    {
      title: "Aktualny poziom",
      value: currentLevel,
      icon: <FaGraduationCap />,
      color: "blue"
    },
    {
      title: "Ukończone testy",
      value: testsCompleted,
      icon: <FaClipboardCheck />,
      color: "green"
    },
    {
      title: "Średni wynik",
      value: `${averageScore}%`,
      icon: <FaChartLine />,
      color: "purple"
    },
    {
      title: "Łączne XP",
      value: xp,
      icon: <FaTrophy />,
      color: "yellow"
    }
  ];

  const colors = {
    blue: {
      bg: "bg-blue-50",
      icon: "bg-blue-100 text-blue-600"
    },
    green: {
      bg: "bg-green-50",
      icon: "bg-green-100 text-green-600"
    },
    purple: {
      bg: "bg-purple-50",
      icon: "bg-purple-100 text-purple-600"
    },
    yellow: {
      bg: "bg-yellow-50",
      icon: "bg-yellow-100 text-yellow-600"
    }
  };

  return (
    <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`${colors[card.color].bg} rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 min-w-0`}
        >
          <div
            className={`w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl mb-3 md:mb-4 ${colors[card.color].icon}`}
          >
            {card.icon}
          </div>

          <p className="text-xs md:text-sm text-gray-500">{card.title}</p>

          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2 break-words">
            {card.value}
          </h3>
        </div>
      ))}
    </section>
  );
};

export default ProfileStats;