// src/services/forumModerationService.js

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";

const getTimestampMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();

  const parsedDate = new Date(value).getTime();
  return Number.isNaN(parsedDate) ? 0 : parsedDate;
};

export const getForumReports = async () => {
  const reportsRef = collection(db, "forumReports");
  const reportsQuery = query(reportsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(reportsQuery);

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data()
    }))
    .sort(
      (reportA, reportB) =>
        getTimestampMillis(reportB.createdAt) -
        getTimestampMillis(reportA.createdAt)
    );
};

export const updateForumReportStatus = async ({ reportId, status }) => {
  if (!reportId || !status) {
    throw new Error("Invalid report or status.");
  }

  const reportRef = doc(db, "forumReports", reportId);

  await updateDoc(reportRef, {
    status,
    updatedAt: serverTimestamp()
  });

  return true;
};

export const deleteForumReport = async (reportId) => {
  if (!reportId) {
    throw new Error("Invalid report.");
  }

  const reportRef = doc(db, "forumReports", reportId);

  await deleteDoc(reportRef);

  return true;
};

export const deleteForumPost = async ({ level, postId }) => {
  if (!level || !postId) {
    throw new Error("Invalid level or post.");
  }

  const postRef = doc(db, "forums", level, "posts", postId);

  await deleteDoc(postRef);

  return true;
};

export const deleteForumPostAndResolveReport = async ({
  level,
  postId,
  reportId
}) => {
  if (!level || !postId || !reportId) {
    throw new Error("Insufficient data to moderate the post.");
  }

  await deleteForumPost({
    level,
    postId
  });

  await updateForumReportStatus({
    reportId,
    status: "resolved"
  });

  return true;
};

export default {
  getForumReports,
  updateForumReportStatus,
  deleteForumReport,
  deleteForumPost,
  deleteForumPostAndResolveReport
};