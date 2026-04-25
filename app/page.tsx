"use client";

import ChessGame from "@/components/ChessGame";
import { useI18n } from "@/lib/i18n-context";
import { LOCALES, LOCALE_LABEL } from "@/lib/i18n";

export default function Home() {
  const { locale, setLocale, t } = useI18n();
  return (
    <main className="min-h-screen w-full px-4 py-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Chess Arena</h1>
            <p className="text-xs text-zinc-400">{t.tagline}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-md ring-1 ring-zinc-700 text-xs">
              {LOCALES.map(l => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={
                    "px-2 py-1 " +
                    (l === locale
                      ? "bg-emerald-700 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700")
                  }
                  aria-pressed={l === locale}
                >
                  {LOCALE_LABEL[l]}
                </button>
              ))}
            </div>
            <a
              href="https://github.com/GuilhermeMoitinho/chess-arena"
              target="_blank"
              rel="noreferrer noopener"
              className="hidden md:inline rounded-md bg-zinc-800 px-3 py-1.5 text-xs hover:bg-zinc-700"
            >
              {t.github}
            </a>
          </div>
        </header>
        <ChessGame />
      </div>
    </main>
  );
}
