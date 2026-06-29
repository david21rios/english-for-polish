// src/components/profile/ProfileHeader.jsx

import {
  FaEnvelope,
  FaUser,
  FaUserGraduate,
  FaCalendarAlt
} from "react-icons/fa";

const ProfileHeader = ({ userData, userCountry }) => {
  const fullName =
    `${userData?.name || ""} ${userData?.lastName || ""}`.trim() || "Student";

  const currentLevel = userData?.currentLevel || "Not determined";

  const memberSince = userData?.createdAt?.toDate
    ? userData.createdAt.toDate().toLocaleDateString()
    : "Not available";

  const infoCards = [
    {
      label: "Email",
      value: userData?.email || "Not available",
      icon: <FaEnvelope />,
      iconClass: "bg-primary-100 text-primary-600",
      breakValue: true
    },
    {
      label: "Country",
      value: userCountry?.name || "Not specified",
      icon: userCountry?.flag || "🌎",
      iconClass: "bg-green-100 text-green-700"
    },
    {
      label: "Member since",
      value: memberSince,
      icon: <FaCalendarAlt />,
      iconClass: "bg-blue-100 text-blue-700"
    },
    {
      label: "Current level",
      value: currentLevel,
      icon: <FaUserGraduate />,
      iconClass: "bg-yellow-100 text-yellow-700"
    }
  ];

  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-4 md:p-8">
      <div className="grid lg:grid-cols-[260px_1fr] gap-4 md:gap-8 items-stretch">
        <div className="bg-gradient-to-b from-primary-50 to-white rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center text-center border border-primary-100">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-4xl md:text-6xl mb-3 md:mb-5">
            <FaUser />
          </div>

          <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
            Student Profile
          </p>

          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mt-2 md:mt-3 leading-tight break-words">
            {fullName}
          </h1>
        </div>

        <div className="grid xl:grid-cols-[1fr_300px] gap-4 md:gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
            {infoCards.map((card) => (
              <div
                key={card.label}
                className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-5 border border-gray-100 flex items-start gap-3 md:gap-4 min-w-0"
              >
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 text-lg md:text-xl ${card.iconClass}`}
                >
                  {card.icon}
                </div>

                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500">
                    {card.label}
                  </p>

                  <p
                    className={`font-bold text-gray-900 text-sm md:text-base ${
                      card.breakValue ? "break-all" : "break-words"
                    }`}
                  >
                    {card.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary-50 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-primary-100 flex items-center md:items-start gap-4 md:block">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-2xl md:text-3xl shrink-0 md:mb-5">
              <FaUserGraduate />
            </div>

            <div>
              <p className="text-xs md:text-sm text-gray-600">
                Current level
              </p>

              <h2 className="text-3xl md:text-5xl font-black text-primary-700 mt-1 md:mt-2 leading-none">
                {currentLevel}
              </h2>

              <p className="text-sm md:text-base text-gray-600 mt-2 md:mt-4 leading-relaxed">
                Your learning route is based on your latest diagnostic test.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileHeader;