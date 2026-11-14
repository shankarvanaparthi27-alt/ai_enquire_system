import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { env, isFirebaseConfigured } from '@/lib/config/env';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

if (typeof window !== 'undefined' || isFirebaseConfigured) {
  if (isFirebaseConfigured) {
    app = getApps().length > 0 ? getApp() : initializeApp(env.firebase);
    auth = getAuth(app);
  }
}

export { app, auth, googleProvider, isFirebaseConfigured };
