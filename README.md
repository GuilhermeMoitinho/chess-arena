# ♟ Chess Arena

> Jogue xadrez no navegador contra o **Stockfish**. 100% local, sem login, sem servidor.
> *Play chess against Stockfish in your browser. Fully local, no signup, no server.*

**🎮 Live demo:** https://chess-arena-delta.vercel.app

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ O que tem

- ♜ Tabuleiro com drag-and-drop
- 🤖 Engine **Stockfish 18** rodando direto no navegador (Web Worker + WASM single-thread, sem precisar de COOP/COEP)
- 🎚 6 níveis de dificuldade — do iniciante (skill 0) ao mestre (skill 20)
- 📊 Barra de avaliação em tempo real
- 🪦 Peças capturadas + diferença de material
- 📜 Lista de jogadas + export FEN / PGN num clique
- ↩️ Desfazer / reiniciar
- 🔁 Trocar de lado (jogar de brancas ou pretas)
- 💾 Persiste suas preferências no `localStorage`
- 🚫 Zero analytics, zero rastreio, zero backend

## 🚀 Rodando local

Precisa de [Bun](https://bun.sh) (ou npm/pnpm/yarn — só trocar os comandos):

```bash
git clone https://github.com/GuilhermeMoitinho/chess-arena.git
cd chess-arena
bun install        # também copia o Stockfish pra public/ via postinstall
bun dev            # http://localhost:3000
```

Build de produção:

```bash
bun run build
bun start
```

## 🏗 Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Linguagem | TypeScript estrito |
| Estilos | Tailwind CSS 3 |
| Regras de xadrez | [`chess.js`](https://github.com/jhlywa/chess.js) |
| UI do tabuleiro | [`react-chessboard`](https://github.com/Clariity/react-chessboard) v4 |
| Engine | [`stockfish`](https://github.com/nmrugg/stockfish.js) 18 (lite, single-threaded WASM) |

O binário do Stockfish (~7 MB de `.wasm`) **não fica versionado**. Um script `postinstall` copia de `node_modules/stockfish/bin/` pra `public/stockfish/` toda vez que vc roda `bun install`.

## 🌍 Deploy

Funciona em qualquer host estático que rode Node. Recomendado:

- **Vercel** — `vercel deploy`. Sem config extra.
- **Cloudflare Pages** — funciona, build command `bun run build`, output `.next`.
- **Self-hosted** — `bun run build && bun start`.

> Como é single-threaded, **não precisa** dos headers `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` que o Stockfish multi-thread exige.

## 🗺 Roadmap

- [ ] Setas e highlights do último lance
- [ ] Promoção com modal de escolha (hoje promove sempre pra dama)
- [ ] Modo "puzzle" com posições famosas
- [ ] Temas alternativos de tabuleiro
- [ ] Compartilhar partida via URL (PGN encodado)
- [ ] Versão multi-thread opcional pra quem servir com COOP/COEP

PRs bem-vindos. Issues também.

## 📄 Licença

MIT — veja [`LICENSE`](./LICENSE).

Stockfish é GPLv3 e é um binário separado servido como worker. Não é linkado estaticamente nesse repositório.
