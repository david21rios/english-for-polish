// src/components/admin/AdminNavigationCards.jsx

import {
  FaBook,
  FaClipboardList,
  FaDatabase,
  FaFlag,
  FaLayerGroup,
  FaGamepad,
  FaCubes
} from "react-icons/fa";

const AdminNavigationCards = ({
  navigate,
  initLoading = false,
  onInitializeDatabase
}) => {
  const cards = [
    {
      icon: FaBook,
      text: "Lekcje",
      path: "/admin/lessons",
      bgColor: "bg-green-500 hover:bg-green-600"
    },
    {
      icon: FaBook,
      text: "Generator AI lekcji",
      path: "/admin/ai-lessons",
      bgColor: "bg-primary-600 hover:bg-primary-700"
    },
    {
      icon: FaCubes,
      text: "Moduły",
      path: "/admin/modules",
      bgColor: "bg-orange-500 hover:bg-orange-600"
    },
    {
      icon: FaClipboardList,
      text: "Testy",
      path: "/admin/tests",
      bgColor: "bg-blue-500 hover:bg-blue-600"
    },
    {
      icon: FaLayerGroup,
      text: "Tematy",
      path: "/admin/temas",
      bgColor: "bg-purple-500 hover:bg-purple-600"
    },
    {
      icon: FaGamepad,
      text: "Misje",
      path: "/admin/missions",
      bgColor: "bg-indigo-500 hover:bg-indigo-600"
    },
    {
      icon: FaFlag,
      text: "Zgłoszenia forum",
      path: "/admin/forum-reports",
      bgColor: "bg-red-500 hover:bg-red-600"
    }
  ];

  const AdminButton = ({
    icon: Icon,
    text,
    onClick,
    bgColor,
    disabled = false
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${bgColor} text-white px-5 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {Icon && <Icon className="text-xl" />}
      <span className="font-semibold">{text}</span>
    </button>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <AdminButton
          key={card.path}
          icon={card.icon}
          text={card.text}
          onClick={() => navigate(card.path)}
          bgColor={card.bgColor}
        />
      ))}

      <AdminButton
        icon={FaDatabase}
        text={initLoading ? "Inicjalizowanie..." : "Inicjalizuj poziomy"}
        onClick={onInitializeDatabase}
        bgColor="bg-gray-700 hover:bg-gray-800"
        disabled={initLoading}
      />
    </div>
  );
};

export default AdminNavigationCards;