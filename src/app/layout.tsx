import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { PostHogProvider } from '@/components/posthog-provider';
import dynamic from "next/dynamic";

const PostHogPageView = dynamic(() => import('@/components/PostHogPageView'), { ssr: false });

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const lexend = Lexend({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lexend',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: "Focus Mentor - Your AI Study Assistant",
  description: "Personalize your learning with AI-powered study plans and resources.",
  openGraph: {
    title: "Focus Mentor - Your AI Study Assistant",
    description: "Personalize your learning with AI-powered study plans and resources.",
    siteName: 'Focus Mentor - Your AI Study Assistant',
    type: "website",
    images: [
      {
        url: '/thumbnail.png',
        width: 1200,
        height: 630,
        alt: 'Focus Mentor - Your AI Study Assistant'
      }
    ]
  },
  twitter: {
    title: "Focus Mentor - Your AI Study Assistant",
    description: "Personalize your learning with AI-powered study plans and resources.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={`${inter.variable} ${lexend.variable} font-sans antialiased min-h-screen bg--background`}
      >
        <NextAuthProvider>
          <PostHogProvider>
            <PostHogPageView />
            {children}
            <Toaster />
          </PostHogProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
