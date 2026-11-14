# UniVerse AI — Intelligent College Enquiry System (Part 1 of 5)

An enterprise-grade, multilingual, multi-college discovery and enquiry platform built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, **Firebase Authentication**, and **Supabase PostgreSQL**.

---

## Architecture Highlights

- **Next.js 16 App Router**: Server Components, Client Contexts, and API route verification.
- **Multilingual Support (6 Languages)**: English, Telugu (తెలుగు), Hindi (हिन्दी), Tamil (தமிழ்), Kannada (ಕನ್ನಡ), Punjabi (ਪੰਜਾਬੀ).
- **Decoupled Auth & Database**:
  - Firebase Authentication for email/password, Google OAuth, email verification, and recovery.
  - Server-side Firebase ID-token verification.
  - Supabase PostgreSQL with strict Row Level Security (RLS) for college directories, courses, fees, profiles, and shortlists.
- **Futuristic AI SaaS UI**: Dual light/dark mode with electric blue and neon purple accents on deep navy surfaces, skeleton loaders, and empty states.
- **Structured College Discovery**: Multi-factor search by name, location, stream, category, fee range, rating, and NIRF rank.

---

## Quick Start

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the portal.

---

## Documentation

- **Architecture Details**: [`docs/architecture.md`](docs/architecture.md)
- **Implementation Checklist**: [`docs/implementation-checklist.md`](docs/implementation-checklist.md)
- **Setup & Firebase/Supabase Config**: [`docs/setup-instructions.md`](docs/setup-instructions.md)
- **Database Migrations**: [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)


# ai_enquire_system
