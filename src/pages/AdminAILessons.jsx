// src/pages/AdminAILessons.jsx

import AILessonGenerator from "../components/admin/AILessonGenerator";

const AdminAILessons = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-10">
      <div className="container mx-auto px-4 max-w-7xl">
        <AILessonGenerator />
      </div>
    </div>
  );
};

export default AdminAILessons;