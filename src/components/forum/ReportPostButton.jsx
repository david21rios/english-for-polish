// src/components/forum/ReportPostButton.jsx

import { useState } from "react";
import { FaFlag, FaTimes } from "react-icons/fa";
import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";
import { auth, db } from "../../firebase";

const REPORT_REASONS = [
  "Inappropriate content",
  "Spam",
  "Harassment or offensive language",
  "Wrong level or irrelevant topic",
  "Other"
];

const ReportPostButton = ({
  post,
  asMenuItem = false,
  onClose
}) => {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [reported, setReported] = useState(false);

  const user = auth.currentUser;

  const openModal = () => {
    setShowModal(true);
    onClose?.();
  };

  const handleSubmitReport = async (event) => {
    event.preventDefault();

    if (!user || !post?.id) {
      alert("No se pudo identificar el usuario o la publicación.");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "forumReports"), {
        postId: post.id,
        level: post.level || "",
        postUserId: post.userId || "",
        postText: post.text || "",
        reportedBy: user.uid,
        reporterEmail: user.email || "",
        reason,
        details: details.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setReported(true);
      setShowModal(false);
      setDetails("");
      alert("Report sent for review.");
    } catch (error) {
      console.error("Error reporting post:", error);
      alert("Could not send the report.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {asMenuItem ? (
        <button
          type="button"
          onClick={openModal}
          disabled={reported}
          className="
            w-full
            px-4
            py-3
            text-left
            text-red-600
            hover:bg-red-50
            flex
            items-center
            gap-3
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >
          <FaFlag />
          {reported ? "Reported" : "Report"}
        </button>
      ) : (
        <button
          type="button"
          onClick={openModal}
          disabled={reported}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm md:text-base font-semibold hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaFlag />
          {reported ? "Reported" : "Report"}
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-3 sm:px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col">
            <header className="bg-red-600 text-white px-5 md:px-6 py-4 md:py-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-red-100 text-xs md:text-sm font-semibold uppercase tracking-wide">
                  Forum moderation
                </p>

                <h2 className="text-xl md:text-2xl font-bold mt-1">
                  Report post
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0 disabled:opacity-50"
                aria-label="Close report modal"
              >
                <FaTimes />
              </button>
            </header>

            <form
              onSubmit={handleSubmitReport}
              className="p-5 md:p-6 space-y-4 md:space-y-5 overflow-y-auto"
            >
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <p className="text-xs md:text-sm text-gray-500 mb-2">
                  Reported post
                </p>

                <p className="text-sm md:text-base text-gray-700 line-clamp-4 break-words">
                  {post?.text || "No content available"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason
                </label>

                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {REPORT_REASONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional details
                </label>

                <textarea
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  rows="4"
                  maxLength={500}
                  placeholder="Add context for the moderator..."
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm md:text-base resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                />

                <p className="text-xs text-gray-500 mt-1">
                  {details.length}/500 characters
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  <FaFlag />
                  {saving ? "Sending..." : "Send report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportPostButton;