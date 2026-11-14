# UniVerse AI — System Architecture (Part 1 of 5)

## 1. System Overview

UniVerse AI is an enterprise-grade multi-college enquiry and discovery platform tailored for higher education across India.
The system implements a decoupled architecture:

- **Frontend & App Router**: Next.js 16 with React 19, TypeScript, and Tailwind CSS v4.
- **Identity & Authentication**: Firebase Authentication (Client SDK) + `firebase-admin` (Server Token Verification).
- **Relational Database**: Supabase PostgreSQL for official colleges, courses, fee structures, student profiles, and favourites.
- **Object Storage**: Supabase Storage for institutional prospectuses and media assets.
- **Multilingual Support**: First-class internationalization across 6 regional Indian languages (English, Telugu, Hindi, Tamil, Kannada, Punjabi).
- **Future AI Layer (Phase 2 & 3)**: Google Gemini API integration for multi-lingual conversational counseling and RAG over verified institutional knowledge bases.

---

## 2. Decoupled Authentication & Database Architecture

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT BROWSER                                    |
|   +-----------------------+     +------------------------+   +----------------+   |
|   |  Next.js 16 UI / UX   | <-> | Language Context (i18n)| < | Theme Context  |   |
|   |  (Futuristic SaaS)    |     | (EN, TE, HI, TA, KN, PA)|   | (Dark / Light) |   |
|   +-----------------------+     +------------------------+   +----------------+   |
|               |                                  |                                |
|               v                                  v                                |
|   +-----------------------+          +----------------------------------------+   |
|   | Firebase Auth Client  |          | Supabase PostgreSQL Client             |   |
|   | (Email/Pass & Google) |          | (Read: Colleges, Courses, Fees, RLS)   |   |
|   +-----------------------+          +----------------------------------------+   |
+---------------+----------------------------------+--------------------------------+
                |                                  |
                v                                  v
+-------------------------------+  +------------------------------------------------+
|  FIREBASE AUTHENTICATION      |  |             SUPABASE POSTGRESQL                |
|  - Manages User Credentials   |  |  - profiles (linked by firebase_uid)           |
|  - Issues Secure ID Tokens    |  |  - colleges & college_contacts                 |
|  - Email Verification         |  |  - courses & fees                              |
|  - Password Recovery Flow     |  |  - favourite_colleges & recently_viewed        |
+-------------------------------+  |  - Strict Row Level Security (RLS)             |
                                   +------------------------------------------------+
```

---

## 3. Database Entities & Security

### Tables:
1. `profiles`: Maps `firebase_uid` to student profile data.
2. `colleges`: Master directory of verified colleges. Read-only for students; writable only via `service_role`.
3. `college_contacts`: Official admission helplines, addresses, and emails.
4. `courses`: Accredited programs, degrees, departments, duration, eligibility, seats.
5. `fees`: Breakdown of tuition, hostel, and academic year expenses.
6. `favourite_colleges`: Student shortlist with unique constraint on `(user_id, college_id)`.
7. `recently_viewed_colleges`: Browsing history with timestamps.

### Row Level Security (RLS):
- Students can only read and modify their own records.
- College records are public read-only (`SELECT`), protected against student mutation.

---

## 4. Multilingual & Theme Strategy
- **Languages**: `en` (default), `te` (Telugu), `hi` (Hindi), `ta` (Tamil), `kn` (Kannada), `pa` (Punjabi).
- **Storage**: Persisted to `localStorage` and saved to `profiles.preferred_language` on update.
- **Theme**: Automatic system detection with manual toggle for Light/Dark mode without UI flashing.
