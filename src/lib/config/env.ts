export const env = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  gemini: {
    apiKey: (process.env.GEMINI_API_KEY || '').replace(/^["']|["']$/g, '').trim(),
  },
};

export const isFirebaseConfigured = Boolean(
  env.firebase.apiKey &&
  env.firebase.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
  env.firebase.projectId
);

export const isSupabaseConfigured = Boolean(
  env.supabase.url &&
  env.supabase.url !== 'https://your-project.supabase.co' &&
  env.supabase.anonKey
);

export const isGeminiConfigured = Boolean(
  env.gemini.apiKey &&
  env.gemini.apiKey !== 'YOUR_GEMINI_API_KEY'
);
