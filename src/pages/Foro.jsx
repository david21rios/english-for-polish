// src/pages/Foro.jsx

import { useEffect, useState, useCallback } from "react";
import { auth, db } from "../firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";

import ForumHeader from "../components/forum/ForumHeader";
import ReplyModal from "../components/forum/ReplyModal";
import ForumLevelTabs from "../components/forum/ForumLevelTabs";
import CreatePostForm from "../components/forum/CreatePostForm";
import ForumPostsList from "../components/forum/ForumPostsList";
import ForumStats from "../components/forum/ForumStats";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const normalizeForumLevel = (level = "A1") => {
  if (LEVELS.includes(level)) return level;

  const levelMap = {
    "A1-A2": "A2",
    "A2-B1": "B1",
    "B1-B2": "B2",
    "B2-C1": "C1",
    "C1-C2": "C2"
  };

  return levelMap[level] || "A1";
};

const Foro = () => {
  const [userData, setUserData] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState("A1");
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [saving, setSaving] = useState(false);

  const user = auth.currentUser;

  const getAllowedLevels = (currentLevel = "A1") => {
    const normalizedLevel = normalizeForumLevel(currentLevel);
    const index = LEVELS.indexOf(normalizedLevel);

    return index >= 0 ? LEVELS.slice(0, index + 1) : ["A1"];
  };

  const loadPosts = useCallback(async (level) => {
    try {
      setLoadingPosts(true);

      const postsRef = collection(db, "forums", level, "posts");
      const postsQuery = query(postsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(postsQuery);

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));

      setPosts(data);
    } catch (error) {
      console.error("Error loading posts:", error);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          const normalizedLevel = normalizeForumLevel(
            data.currentLevel || data.placementLevel || "A1"
          );

          setUserData({
            ...data,
            currentLevel: normalizedLevel
          });

          setSelectedLevel(normalizedLevel);
        }
      } catch (error) {
        console.error("Error loading forum user:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [user]);

  useEffect(() => {
    loadPosts(selectedLevel);
  }, [selectedLevel, loadPosts]);

  const handleCreatePost = async (event) => {
    event.preventDefault();

    if (userData?.forumBlocked) {
      alert("Your forum access has been restricted.");
      return;
    }

    const cleanText = postText.trim();

    if (!cleanText || !user) return;

    if (cleanText.length < 10) {
      alert("Please write a more complete post.");
      return;
    }

    try {
      setSaving(true);

      const postsRef = collection(db, "forums", selectedLevel, "posts");

      await addDoc(postsRef, {
        text: cleanText,
        level: selectedLevel,
        userId: user.uid,
        userName: userData?.name || user.displayName || "Student",
        userEmail: user.email || "",
        repliesCount: 0,
        likes: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setPostText("");
      await loadPosts(selectedLevel);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("There was an error creating the post.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (post) => {
    if (!user || !post?.id) return;

    if (post.userId !== user.uid) {
      alert("You can only delete your own posts.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone."
    );

    if (!confirmDelete) return;

    try {
      const postRef = doc(db, "forums", post.level, "posts", post.id);
      await deleteDoc(postRef);

      await loadPosts(selectedLevel);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("There was an error deleting the post.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-11 w-11 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading forum...</p>
        </div>
      </div>
    );
  }

  const allowedLevels = getAllowedLevels(userData?.currentLevel);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white pt-4 pb-8 md:py-10 overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
        <div className="space-y-5 md:space-y-7">
          <ForumHeader />

          <ForumStats
            currentLevel={userData?.currentLevel || "A1"}
            totalPosts={posts.length}
            totalReplies={posts.reduce(
              (total, post) => total + (post.repliesCount || 0),
              0
            )}
            activeMembers={new Set(posts.map((post) => post.userId)).size}
          />

          <ForumLevelTabs
            selectedLevel={selectedLevel}
            allowedLevels={allowedLevels}
            onSelectLevel={setSelectedLevel}
          />

          {userData?.forumBlocked && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-3xl p-5 md:p-6">
              <h3 className="font-bold text-base md:text-lg mb-2">
                Forum access restricted
              </h3>

              <p className="text-sm md:text-base">
                Your forum account has been temporarily blocked by a moderator.
              </p>

              {userData?.forumBlockedReason && (
                <p className="mt-2 font-semibold text-sm md:text-base">
                  Reason: {userData.forumBlockedReason}
                </p>
              )}
            </div>
          )}

          {!userData?.forumBlocked && (
            <CreatePostForm
              selectedLevel={selectedLevel}
              postText={postText}
              saving={saving}
              onPostTextChange={setPostText}
              onSubmit={handleCreatePost}
            />
          )}

          {loadingPosts ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Loading posts...</p>
            </div>
          ) : (
            <ForumPostsList
              posts={posts}
              onViewReplies={setSelectedPost}
              onLiked={() => loadPosts(selectedLevel)}
              onDelete={handleDeletePost}
            />
          )}
        </div>
      </div>

      {selectedPost && (
        <ReplyModal
          post={selectedPost}
          level={selectedLevel}
          onClose={() => setSelectedPost(null)}
          onReplySaved={() => loadPosts(selectedLevel)}
        />
      )}
    </div>
  );
};

export default Foro;