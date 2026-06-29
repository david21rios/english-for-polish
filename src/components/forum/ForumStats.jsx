// src/components/forum/ForumStats.jsx

import {
  FaComments,
  FaReply,
  FaUserGraduate,
  FaUsers
} from "react-icons/fa";

const ForumStats = ({
  currentLevel = "A1-A2",
  totalPosts = 0,
  totalReplies = 0,
  activeMembers = 0
}) => {
  const stats = [
    {
      title: "Level",
      value: currentLevel,
      icon: <FaUserGraduate />,
      bg: "bg-blue-50",
      iconBg: "bg-blue-100 text-blue-600"
    },
    {
      title: "Posts",
      value: totalPosts,
      icon: <FaComments />,
      bg: "bg-green-50",
      iconBg: "bg-green-100 text-green-600"
    },
    {
      title: "Replies",
      value: totalReplies,
      icon: <FaReply />,
      bg: "bg-purple-50",
      iconBg: "bg-purple-100 text-purple-600"
    },
    {
      title: "Members",
      value: activeMembers,
      icon: <FaUsers />,
      bg: "bg-yellow-50",
      iconBg: "bg-yellow-100 text-yellow-700"
    }
  ];

  return (
    <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-8">
      {stats.map((item) => (
        <div
          key={item.title}
          className={`${item.bg} rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm p-4 md:p-6 min-w-0`}
        >
          <div
            className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl mb-3 md:mb-4 ${item.iconBg}`}
          >
            {item.icon}
          </div>

          <p className="text-xs md:text-sm text-gray-500">
            {item.title}
          </p>

          <h3 className="text-xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2 break-words">
            {item.value}
          </h3>
        </div>
      ))}
    </section>
  );
};

export default ForumStats;