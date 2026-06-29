// src/components/forum/ReplyModal.jsx

import { useEffect, useState, useCallback } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { FaPaperPlane, FaTimes, FaUserCircle } from "react-icons/fa";
import { auth, db } from "../../firebase";

const ReplyModal = ({
  post,
  level,
  onClose,
  onReplySaved
}) => {
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const user = auth.currentUser;

  const loadUserData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, [user?.uid]);

  const loadReplies = useCallback(async () => {
    if (!post?.id || !level) return;

    try {
      setLoading(true);

      const repliesRef = collection(
        db,
        "forums",
        level,
        "posts",
        post.id,
        "replies"
      );

      const repliesQuery = query(repliesRef, orderBy("createdAt", "asc"));
      const snapshot = await getDocs(repliesQuery);

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));

      setReplies(data);
    } catch (error) {
      console.error("Error loading replies:", error);
    } finally {
      setLoading(false);
    }
  }, [post?.id, level]);

  useEffect(() => {
    loadUserData();
    loadReplies();
  }, [loadUserData, loadReplies]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (userData?.forumBlocked) {
      alert("Your forum access has been restricted.");
      return;
    }

    const cleanText = replyText.trim();

    if (!cleanText || !user || !post?.id || !level) return;

    if (cleanText.length < 5) {
      alert("Please write a more complete reply.");
      return;
    }

    try {
      setSaving(true);

      const repliesRef = collection(
        db,
        "forums",
        level,
        "posts",
        post.id,
        "replies"
      );

      await addDoc(repliesRef, {
        text: cleanText,
        userId: user.uid,
        userName:
          userData?.name ||
          user.displayName ||
          user.email ||
          "Student",
        userEmail: user.email || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const postRef = doc(db, "forums", level, "posts", post.id);

      await updateDoc(postRef, {
        repliesCount: increment(1),
        updatedAt: serverTimestamp()
      });

      setReplyText("");
      await loadReplies();
      onReplySaved?.();
    } catch (error) {
      console.error("Error saving reply:", error);
      alert("There was an error saving your reply.");
    } finally {
      setSaving(false);
    }
  };

  if (!post) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-3 sm:px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
        <header className="bg-primary-600 text-white px-5 md:px-6 py-4 md:py-5 flex justify-between items-start gap-4">
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-primary-100 font-semibold uppercase tracking-wide">
              Forum discussion
            </p>

            <h2 className="text-xl md:text-2xl font-bold mt-1">
              Replies
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0"
            aria-label="Close replies"
          >
            <FaTimes />
          </button>
        </header>

        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          <article className="bg-gray-50 border border-gray-100 rounded-2xl p-4 md:p-5 mb-5 md:mb-6">
            <div className="flex gap-3 md:gap-4">
              <FaUserCircle className="text-3xl md:text-4xl text-gray-400 shrink-0" />

              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-sm md:text-base break-words">
                  {post.userName || "Student"}
                </h3>

                <p className="text-xs md:text-sm text-gray-500">
                  Level {post.level || level}
                </p>

                <p className="text-sm md:text-base text-gray-700 mt-3 md:mt-4 leading-relaxed break-words whitespace-pre-wrap">
                  {post.text}
                </p>
              </div>
            </div>
          </article>

          {loading ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              Loading replies...
            </div>
          ) : replies.length === 0 ? (
            <div className="text-center bg-gray-50 border border-gray-100 rounded-2xl p-5 md:p-6 text-sm md:text-base text-gray-600">
              No replies yet. Be the first to answer.
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {replies.map((reply) => (
                <article
                  key={reply.id}
                  className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm"
                >
                  <div className="flex gap-3 md:gap-4">
                    <FaUserCircle className="text-2xl md:text-3xl text-gray-400 shrink-0" />

                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm md:text-base break-words">
                        {reply.userName || "Student"}
                      </h4>

                      <p className="text-sm md:text-base text-gray-700 mt-2 leading-relaxed break-words whitespace-pre-wrap">
                        {reply.text}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {userData?.forumBlocked ? (
          <div className="border-t bg-red-50 border-red-100 p-4 md:p-5 text-red-700">
            <h3 className="font-bold text-sm md:text-base">
              Forum access restricted
            </h3>

            <p className="mt-1 text-sm">
              Your forum account has been temporarily blocked by a moderator.
            </p>

            {userData?.forumBlockedReason && (
              <p className="mt-2 font-semibold text-sm">
                Reason: {userData.forumBlockedReason}
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="border-t bg-white p-4 md:p-5">
            <textarea
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              rows="3"
              maxLength={800}
              placeholder="Write your reply..."
              className="w-full border border-gray-300 rounded-2xl p-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-3">
              <span className="text-xs md:text-sm text-gray-500">
                {replyText.length}/800 characters
              </span>

              <button
                type="submit"
                disabled={saving || replyText.trim().length < 5}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPaperPlane />
                {saving ? "Sending..." : "Reply"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReplyModal;