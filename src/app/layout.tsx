import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { AppShell } from '@/components/layout/AppShell';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'UniVerse AI — Intelligent College Discovery & Admissions Platform',
  description: 'Discover verified colleges across India, compare accredited degree programs, and plan your higher education journey with AI precision.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              <AuthProvider>
                <div className="flex flex-col min-h-screen">
                  <Suspense fallback={<div className="h-16 border-b border-slate-800 bg-slate-900" />}>
                    <Navbar />
                  </Suspense>
                  <Suspense fallback={<div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]" />}>
                    <AppShell>{children}</AppShell>
                  </Suspense>
                </div>
              </AuthProvider>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
