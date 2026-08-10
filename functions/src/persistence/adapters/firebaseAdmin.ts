import { applicationDefault, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export interface FirebaseAdminServices {
  readonly app: App;
  readonly auth: Auth;
  readonly firestore: Firestore;
}

export const initializeFirebaseAdmin = (projectId?: string): FirebaseAdminServices => {
  const app = getApps().length === 0
    ? initializeApp(projectId === undefined ? { credential: applicationDefault() } : { credential: applicationDefault(), projectId })
    : getApp();
  return Object.freeze({ app, auth: getAuth(app), firestore: getFirestore(app) });
};
