// src/components/profile/ProfileActivity.jsx

import {
  FaCalendarCheck,
  FaCheckCircle,
  FaClock,
  FaFire
} from "react-icons/fa";

const formatLastActivity = (date) => {
  if (!date) return "Brak aktywności";

  return date.toLocaleDateString("pl-PL");
};

const ProfileActivity = ({ activitySummary }) => {
  const completedThisMonth = activitySummary?.completedThisMonth || 0;
  const updatedThisMonth = activitySummary?.updatedThisMonth || 0;
  const lastActivity = activitySummary?.lastActivity || null;

  const activityCards = [
    {
      title: "Ukończone w tym miesiącu",
      value: completedThisMonth,
      description: "Lekcje ukończone w całości w bieżącym miesiącu.",
      icon: <FaCheckCircle />,
      color: "bg-green-100 text-green-700"
    },
    {
      title: "Aktywne lekcje w tym miesiącu",
      value: updatedThisMonth,
      description: "Lekcje otwarte lub zaktualizowane w bieżącym miesiącu.",
      icon: <FaFire />,
      color: "bg-orange-100 text-orange-700"
    },
    {
      title: "Ostatnia aktywność",
      value: formatLastActivity(lastActivity),
      description: "Najnowsza zarejestrowana aktywność edukacyjna.",
      icon: <FaClock />,
      color: "bg-blue-100 text-blue-700"
    }
  ];

  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-4 md:p-8">
      <div className="mb-5 md:mb-6">
        <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
          Aktywność miesięczna
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">
          Aktywność w nauce
        </h2>

        <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed">
          Sprawdź ostatnią aktywność edukacyjną i ukończone lekcje.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5">
        {activityCards.map((card) => (
          <div
            key={card.title}
            className="bg-gray-50 rounded-2xl border border-gray-100 p-4 md:p-5"
          >
            <div
              className={`w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl mb-3 md:mb-5 ${card.color}`}
            >
              {card.icon}
            </div>

            <p className="text-xs md:text-sm text-gray-500">{card.title}</p>

            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2 break-words">
              {card.value}
            </h3>

            <p className="text-xs md:text-sm text-gray-600 mt-2 md:mt-3 leading-relaxed">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 md:mt-6 bg-primary-50 border border-primary-100 rounded-2xl p-4 md:p-5 flex items-start gap-3 md:gap-4">
        <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0">
          <FaCalendarCheck />
        </div>

        <div>
          <h3 className="font-bold text-gray-900 text-sm md:text-base">
            Informacja o aktywności
          </h3>

          <p className="text-sm md:text-base text-gray-600 mt-1 leading-relaxed">
            Lekcja jest uznawana za ukończoną dopiero po zakończeniu wszystkich
            sekcji i przejściu do kolejnej lekcji.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProfileActivity;