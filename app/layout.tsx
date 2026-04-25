import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n-context";

export const metadata: Metadata = {
  title: "Chess Arena — play chess vs Stockfish, fully offline",
  description:
    "Play chess against Stockfish in your browser with a real-time coach that grades every move. 6 difficulty levels, no login, no server, no tracking. Free offline chess trainer in EN / PT / ES.",
  keywords: [
    "chess",
    "stockfish",
    "chess coach",
    "play chess online",
    "free chess",
    "chess trainer",
    "chess engine",
    "browser chess",
    "xadrez online",
    "ajedrez",
  ],
  openGraph: {
    title: "Chess Arena — Stockfish + live coach, in your browser",
    description:
      "Play chess vs Stockfish with a real-time coach grading every move. Fully offline. Free, no login.",
    type: "website",
    locale: "en_US",
    alternateLocale: ["pt_BR", "es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chess Arena — Stockfish + live coach",
    description:
      "Play chess vs Stockfish with a real-time coach grading every move. Fully offline. Free, no login.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
