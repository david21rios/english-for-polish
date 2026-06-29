// src/services/forumModerationService.js

import {
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";

export const updateForumReportStatus = async ({
  reportId,
  status
}) => {
  if (!reportId || !status) {
    throw new Error("Reporte o estado no válido.");
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
    throw new Error("Reporte no válido.");
  }

  const reportRef = doc(db, "forumReports", reportId);

  await deleteDoc(reportRef);

  return true;
};

export const deleteForumPost = async ({
  level,
  postId
}) => {
  if (!level || !postId) {
    throw new Error("Nivel o publicación no válidos.");
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
    throw new Error("Datos insuficientes para moderar la publicación.");
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
  updateForumReportStatus,
  deleteForumReport,
  deleteForumPost,
  deleteForumPostAndResolveReport
};