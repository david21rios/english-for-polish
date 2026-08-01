import { validServerTimestamp, withOverrides } from "../helpers/testPayloads.mjs";

export const FORUM_REPORT_REASONS = Object.freeze([
  "Inappropriate content",
  "Spam",
  "Harassment or offensive language",
  "Wrong level or irrelevant topic",
  "Other",
]);

export const validForumReport = (overrides = {}) => withOverrides({
  postId: "post-seed-01",
  level: "A1",
  postUserId: "forum-other-01",
  postText: "Synthetic reported post",
  reportedBy: "forum-user-01",
  reporterEmail: "forum-user-01@example.test",
  reason: "Spam",
  details: "",
  status: "pending",
  createdAt: validServerTimestamp(),
  updatedAt: validServerTimestamp(),
}, overrides);
