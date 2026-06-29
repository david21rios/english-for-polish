// src/components/profile/ProfileSettings.jsx

import {
  FaEdit,
  FaLock,
  FaUserCircle
} from "react-icons/fa";

const ProfileSettings = ({
  onEditProfile,
  onChangePassword
}) => {
  const settings = [
    {
      title: "Edit Profile",
      description: "Update your name, age and country.",
      icon: <FaEdit />,
      onClick: onEditProfile,
      cardClass: "bg-primary-50 hover:bg-primary-100 border-primary-100",
      iconClass: "bg-primary-600 text-white",
      disabled: false
    },
    {
      title: "Change Password",
      description: "Update your account password securely.",
      icon: <FaLock />,
      onClick: onChangePassword,
      cardClass: "bg-yellow-50 hover:bg-yellow-100 border-yellow-100",
      iconClass: "bg-yellow-500 text-white",
      disabled: false
    },
    {
      title: "Choose Avatar",
      description: "Coming soon.",
      icon: <FaUserCircle />,
      onClick: undefined,
      cardClass: "bg-gray-50 border-gray-100 opacity-80",
      iconClass: "bg-gray-200 text-gray-500",
      disabled: true
    }
  ];

  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-4 md:p-8">
      <div className="mb-5 md:mb-6">
        <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
          Account settings
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">
          Profile settings
        </h2>

        <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed">
          Manage your personal information and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5">
        {settings.map((item) => {
          const content = (
            <>
              <div
                className={`w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl mb-3 md:mb-5 ${item.iconClass}`}
              >
                {item.icon}
              </div>

              <h3 className="text-base md:text-xl font-bold text-gray-900">
                {item.title}
              </h3>

              <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2 leading-relaxed">
                {item.description}
              </p>
            </>
          );

          if (item.disabled) {
            return (
              <div
                key={item.title}
                className={`text-left rounded-2xl md:rounded-3xl p-4 md:p-6 border transition-all ${item.cardClass}`}
              >
                {content}
              </div>
            );
          }

          return (
            <button
              key={item.title}
              type="button"
              onClick={item.onClick}
              className={`text-left rounded-2xl md:rounded-3xl p-4 md:p-6 border transition-all ${item.cardClass}`}
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ProfileSettings;