import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ICSE Project Forge — AI-forged ICSE projects + mock papers",
  description:
    "AI-powered ICSE Board (Class 9-10) project assistant. Upload your notes and forge a complete, original ICSE project with diagrams, plus specimen-style mock papers.",
  keywords: [
    "ICSE",
    "ICSE project",
    "Class 10 project",
    "Class 9 project",
    "AI project generator",
    "mock paper",
    "CISCE",
    "Indian board exams",
  ],
  authors: [{ name: "ICSE Project Forge" }],
  openGraph: {
    title: "ICSE Project Forge",
    description:
      "AI-forged ICSE projects with diagrams + mock papers — trained on ICSE board data.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
