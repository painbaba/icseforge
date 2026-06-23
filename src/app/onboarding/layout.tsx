import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome — ICSE Project Forge Onboarding",
  description:
    "Get started with ICSE Project Forge. Learn how to upload notes, generate AI-powered projects, and practice with mock papers.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Suppress parent layout's ambient backdrop by layering over it */}
      <style>{`
        .bg-grid-pattern,
        .animate-pulse-slow,
        .animate-pulse-medium {
          display: none !important;
        }
      `}</style>
      {children}
    </>
  );
}
