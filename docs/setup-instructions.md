# UniVerse AI — Setup & Configuration Instructions (Part 1 of 5)

## 1. Quick Start (Immediate Local Run)

The application has been constructed with zero-friction development in mind. You can start the application immediately:

```bash
# In the project directory:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- The application will automatically run in **Development Mode** with verified Indian institutional seed data.
- You can test student sign-up, sign-in, language switching across all 6 languages, dark/light themes, college searching, filters, shortlisting, and profile updates immediately.

---

## 2. Connecting Live Firebase Authentication

When you are ready to connect your production Firebase project:

1. Visit [Firebase Console](https://console.firebase.google.com/) and create or select a project.
2. Enable **Authentication**:
   - Go to **Build** -> **Authentication** -> **Sign-in method**.
   - Enable **Email/Password**.
   - Enable **Google** (configure web client ID).
3. Obtain your Web App configuration from **Project Settings** -> **General** -> **Your apps**.
4. Create `.env.local` by copying `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
5. Fill in the Firebase keys:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

The application will automatically detect these credentials and switch to live Firebase Authentication.

---

## 3. Connecting Live Supabase Database

1. Visit [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Open the **SQL Editor** in Supabase.
3. Copy the contents of [`supabase/migrations/001_initial_schema.sql`](file:///C:/Users/ASUS/OneDrive/Desktop/aiproject/supabase/migrations/001_initial_schema.sql) and execute it.
4. (Optional) Run [`supabase/seed.sql`](file:///C:/Users/ASUS/OneDrive/Desktop/aiproject/supabase/seed.sql) to populate initial colleges.
5. In Supabase, navigate to **Project Settings** -> **API** and copy your project URL and keys to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

---

## 4. Running Verification Checks

- **Run Dev Server**:
  ```bash
  npm run dev
  ```
- **Run Production Build**:
  ```bash
  npm run build
  ```
- **Run ESLint**:
  ```bash
  npm run lint
  ```
