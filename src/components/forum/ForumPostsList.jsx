// src/components/forum/ForumPostsList.jsx

import ForumPostCard from "./ForumPostCard";

const ForumPostsList = ({
  posts = [],
  onViewReplies,
  onLiked,
  onDelete
}) => {
  if (!posts.length) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-8 text-center">
        <p className="text-sm md:text-base text-gray-600">
          No posts yet in this level. Be the first to participate.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4 md:space-y-5">
      {posts.map((post) => (
        <ForumPostCard
          key={post.id}
          post={post}
          onViewReplies={onViewReplies}
          onLiked={onLiked}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
};

export default ForumPostsList;