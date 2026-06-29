// src/components/forum/ForumPostCard.jsx

import { useEffect, useRef, useState } from "react";
import {
  FaEllipsisV,
  FaRegCommentDots,
  FaTrash,
  FaUserCircle
} from "react-icons/fa";

import { auth } from "../../firebase";

import LikeButton from "./LikeButton";
import ReportPostButton from "./ReportPostButton";

const ForumPostCard = ({
  post,
  onViewReplies,
  onLiked,
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const menuRef = useRef(null);
  const user = auth.currentUser;
  const isOwner = user?.uid === post.userId;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <article className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 md:gap-4">
        <div className="text-3xl md:text-4xl text-gray-400 shrink-0">
          <FaUserCircle />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-sm md:text-base break-words">
                {post.userName || "Student"}
              </h3>

              <p className="text-xs md:text-sm text-gray-500">
                Level {post.level}
              </p>
            </div>

            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                className="w-9 h-9 rounded-xl text-gray-500 hover:bg-gray-100 flex items-center justify-center"
                aria-label="Post options"
              >
                <FaEllipsisV />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-11 w-44 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden z-30">
                  {!isOwner && (
                    <ReportPostButton
                      post={post}
                      asMenuItem
                      onClose={() => setShowMenu(false)}
                    />
                  )}

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onDelete?.(post);
                      }}
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-3"
                    >
                      <FaTrash />
                      Delete post
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="text-sm md:text-base text-gray-700 mt-3 md:mt-4 leading-relaxed whitespace-pre-wrap break-words">
            {post.text}
          </p>

          <div className="mt-4 flex items-center gap-3">
            <LikeButton
              level={post.level}
              postId={post.id}
              likes={post.likes || 0}
              likedBy={post.likedBy || []}
              onLiked={onLiked}
            />

            <button
              type="button"
              onClick={() => onViewReplies(post)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 font-semibold transition"
              aria-label="View replies"
            >
              <FaRegCommentDots />
              {post.repliesCount || 0}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ForumPostCard;