import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chess Arena — jogue xadrez contra o Stockfish",
  description:
    "Tabuleiro de xadrez no navegador com Stockfish em 6 níveis de dificuldade. 100% local, sem login.",
  openGraph: {
    title: "Chess Arena",
    description: "Jogue xadrez contra o Stockfish, no navegador.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
