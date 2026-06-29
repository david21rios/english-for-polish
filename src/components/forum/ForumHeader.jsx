// src/components/forum/ForumHeader.jsx

import { FaComments } from "react-icons/fa";

const ForumHeader = () => {
  return (
    <section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-3 md:p-6">
      <div className="flex items-start gap-4 md:gap-6">
        <div className="w-12 h-12 md:w-18 md:h-18 rounded-2xl md:rounded-3xl bg-primary-100 flex items-center justify-center text-primary-600 text-2xl md:text-4xl shrink-0">
          <FaComments />
        </div>

        <div className="min-w-0">
          <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
            Student Community
          </p>

          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mt-1 md:mt-2">
            Forum
          </h1>

          <p className="text-sm md:text-base text-gray-600 mt-2 md:mt-3 max-w-3xl leading-relaxed">
            Share questions, ideas, learning experiences and practice
            reflections with other students according to your current level.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ForumHeader;