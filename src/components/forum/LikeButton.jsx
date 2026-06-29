// src/components/forum/LikeButton.jsx

import { useState } from "react";
import { FaHeart } from "react-icons/fa";
import {
  arrayRemove,
  arrayUnion,
  doc,
  increment,
  updateDoc
} from "firebase/firestore";
import { auth, db } from "../../firebase";

const LikeButton = ({
  level,
  postId,
  likes = 0,
  likedBy = [],
  onLiked
}) => {
  const [loading, setLoading] = useState(false);

  const user = auth.currentUser;
  const hasLiked = user ? likedBy.includes(user.uid) : false;

  const handleLike = async () => {
    if (loading || !user) return;

    try {
      setLoading(true);

      const postRef = doc(db, "forums", level, "posts", postId);

      await updateDoc(postRef, {
        likes: increment(hasLiked ? -1 : 1),
        likedBy: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });

      onLiked?.();
    } catch (error) {
      console.error("Error updating like:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={loading || !user}
      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm md:text-base font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
        hasLiked
          ? "bg-pink-600 text-white hover:bg-pink-700"
          : "bg-pink-50 text-pink-700 hover:bg-pink-100"
      }`}
    >
      <FaHeart />
      <span>{likes}</span>
    </button>
  );
};

export default LikeButton;