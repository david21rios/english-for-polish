import { validServerTimestamp, withOverrides } from "../helpers/testPayloads.mjs";

export const validForumPost = (overrides = {}) => withOverrides({
  text: "Synthetic forum post text",
  level: "A1",
  userId: "forum-user-01",
  userName: "Synthetic Forum User",
  userEmail: "forum-user-01@example.test",
  repliesCount: 0,
  likes: 0,
  likedBy: [],
  createdAt: validServerTimestamp(),
  updatedAt: validServerTimestamp(),
}, overrides);

export const validForumReply = (overrides = {}) => withOverrides({
  text: "Synthetic reply text",
  userId: "forum-user-01",
  userName: "Synthetic Forum User",
  userEmail: "forum-user-01@example.test",
  createdAt: validServerTimestamp(),
  updatedAt: validServerTimestamp(),
}, overrides);
