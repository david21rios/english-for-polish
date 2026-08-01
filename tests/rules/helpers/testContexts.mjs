export const TEST_CONTEXTS = Object.freeze({
  ANON: { id: "CTX-ANON", authenticated: false },
  FORUM_USER: { id: "CTX-FORUM-USER", uid: "forum-user-01", email: "forum-user-01@example.test" },
  FORUM_BLOCKED: { id: "CTX-FORUM-BLOCKED", uid: "forum-blocked-01", email: "blocked@example.test" },
  FORUM_OTHER: { id: "CTX-FORUM-OTHER", uid: "forum-other-01", email: "other@example.test" },
  SUPPORT_USER: { id: "CTX-SUPPORT-USER", uid: "support-user-01", email: "support-user@example.test" },
  SUPPORT_OTHER: { id: "CTX-SUPPORT-OTHER", uid: "support-other-01", email: "support-other@example.test" },
  LEGACY_ADMIN: { id: "CTX-LEGACY-ADMIN", uid: "legacy-admin-01", email: "legacy-admin@example.test" },
  NON_ADMIN: { id: "CTX-NON-ADMIN", uid: "non-admin-01", email: "non-admin@example.test" },
});

export const testContext = (environment, definition) =>
  definition.authenticated === false
    ? environment.unauthenticatedContext()
    : environment.authenticatedContext(definition.uid, { email: definition.email });
