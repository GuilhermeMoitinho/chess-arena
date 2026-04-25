import ChessGame from "@/components/ChessGame";

export default function Home() {
  return (
    <main className="min-h-screen w-full px-4 py-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Chess Arena</h1>
            <p className="text-xs text-zinc-400">
              Stockfish roda no seu navegador. Sem login, sem servidor, sem rastro.
            </p>
          </div>
          <a
            href="https://github.com/GuilhermeMoitinho/chess-arena"
            target="_blank"
            rel="noreferrer noopener"
            className="hidden md:inline rounded-md bg-zinc-800 px-3 py-1.5 text-xs hover:bg-zinc-700"
          >
            GitHub →
          </a>
        </header>
        <ChessGame />
      </div>
    </main>
  );
}
