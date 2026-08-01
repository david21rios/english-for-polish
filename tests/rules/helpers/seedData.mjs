import { doc, setDoc, Timestamp } from "firebase/firestore";

export const seedDocuments = async (environment, entries) => {
  await environment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    for (const [path, data] of entries) {
      await setDoc(doc(database, ...path.split("/")), data);
    }
  });
};

export const clearRulesTestData = async (environment) => {
  await environment.clearFirestore();
};

export const legacyUserSeed = (uid, { role = "user", forumBlocked = false } = {}) => [
  `users/${uid}`,
  { role, forumBlocked },
];

export const stableTimestamp = () => Timestamp.fromMillis(1704067200000);

export const canonicalPostSeed = (overrides = {}) => [
  "forums/A1/posts/post-seed-01",
  {
    text: "Synthetic seeded forum post",
    level: "A1",
    userId: "forum-user-01",
    userName: "Synthetic Forum User",
    userEmail: "forum-user-01@example.test",
    repliesCount: 0,
    likes: 0,
    likedBy: [],
    createdAt: stableTimestamp(),
    updatedAt: stableTimestamp(),
    ...overrides,
  },
];

export const canonicalReplySeed = (overrides = {}) => [
  "forums/A1/posts/post-seed-01/replies/reply-seed-01",
  {
    text: "Synthetic reply",
    userId: "forum-user-01",
    userName: "Synthetic Forum User",
    userEmail: "forum-user-01@example.test",
    createdAt: stableTimestamp(),
    updatedAt: stableTimestamp(),
    ...overrides,
  },
];
