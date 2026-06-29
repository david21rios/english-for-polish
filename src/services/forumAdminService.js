// src/services/forumAdminService.js

import {
  doc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase";

export const blockForumUser = async ({
  userId,
  reason = "Forum rules violation"
}) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const userRef = doc(db, "users", userId);

  await updateDoc(userRef, {
    forumBlocked: true,
    forumBlockedReason: reason,
    forumBlockedAt: serverTimestamp()
  });

  return true;
};

export const unblockForumUser = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const userRef = doc(db, "users", userId);

  await updateDoc(userRef, {
    forumBlocked: false,
    forumBlockedReason: null,
    forumBlockedAt: null
  });

  return true;
};

export default {
  blockForumUser,
  unblockForumUser
};