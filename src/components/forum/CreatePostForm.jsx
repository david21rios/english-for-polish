// src/components/forum/CreatePostForm.jsx

import { FaPaperPlane } from "react-icons/fa";

const CreatePostForm = ({
  selectedLevel,
  postText,
  saving,
  onPostTextChange,
  onSubmit
}) => {
  const isDisabled = saving || postText.trim().length < 10;

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6">
      <div className="mb-4 md:mb-5">
        <p className="text-xs md:text-sm font-semibold text-primary-600 uppercase tracking-wide">
          New discussion
        </p>

        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-1 leading-tight">
          Create a post in {selectedLevel}
        </h2>

        <p className="text-sm md:text-base text-gray-600 mt-2 leading-relaxed">
          Ask a question, share a learning experience or start a practice
          discussion.
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <textarea
          value={postText}
          onChange={(event) => onPostTextChange(event.target.value)}
          rows="4"
          maxLength={1000}
          placeholder="Write your question, reflection or practice idea..."
          className="
            w-full
            border
            border-gray-300
            rounded-2xl
            p-4
            text-sm
            md:text-base
            focus:outline-none
            focus:ring-2
            focus:ring-primary-500
            resize-none
          "
        />

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 md:gap-4 mt-4">
          <span className="text-xs md:text-sm text-gray-500">
            {postText.length}/1000 characters
          </span>

          <button
            type="submit"
            disabled={isDisabled}
            className="
              w-full
              sm:w-auto
              inline-flex
              items-center
              justify-center
              gap-2
              bg-primary-600
              hover:bg-primary-700
              text-white
              font-semibold
              px-5
              md:px-6
              py-3
              rounded-2xl
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition-colors
            "
          >
            <FaPaperPlane />
            {saving ? "Posting..." : "Publish"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default CreatePostForm;