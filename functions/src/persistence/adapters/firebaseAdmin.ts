import { applicationDefault, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { BootstrapAuthPort } from "../../commands/bootstrapPlatformAdmins.js";
import type { JsonValue } from "../../contracts/types.js";
import { createGovernanceDatabaseHandle } from "./governanceDb.js";

export interface FirebaseAdminServices {
  readonly app: App;
  readonly auth: Auth;
  readonly applicationDb: Firestore;
  readonly governanceDb: Firestore;
  readonly firestore: Firestore;
}

export const initializeFirebaseAdmin = (projectId?: string): FirebaseAdminServices => {
  const app = getApps().length === 0
    ? initializeApp(projectId === undefined ? { credential: applicationDefault() } : { credential: applicationDefault(), projectId })
    : getApp();
  const applicationDb = getFirestore(app);
  const governanceDb = createGovernanceDatabaseHandle(app).firestore;
  return Object.freeze({ app, auth: getAuth(app), applicationDb, governanceDb, firestore: applicationDb });
};

export const createFirebaseAdminBootstrapAuthPort = (auth: Auth): BootstrapAuthPort => Object.freeze({
  getUser: async (uid: string) => {
    const user = await auth.getUser(uid);
    return Object.freeze({ uid: user.uid, email: user.email ?? null, emailVerified: user.emailVerified,
      disabled: user.disabled, customClaims: Object.freeze({ ...(user.customClaims ?? {}) }) });
  },
  setCustomClaims: (uid: string, claims: Readonly<Record<string, JsonValue>>) => auth.setCustomUserClaims(uid, claims),
});
