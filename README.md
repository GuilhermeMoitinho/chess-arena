# ♟ Chess Arena

> Jogue xadrez no navegador contra o **Stockfish**, com um **coach que classifica cada jogada sua em tempo real**. 100% local, sem login, sem servidor.
> *Play chess against Stockfish in your browser, with a real-time coach grading every move you make. 100% local, no signup, no server.*
> *Juega ajedrez contra Stockfish con un coach que clasifica cada jugada en tiempo real.*

**🎮 Live demo:** https://chess-arena-delta.vercel.app

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)
![i18n](https://img.shields.io/badge/i18n-PT%20%E2%80%A2%20EN%20%E2%80%A2%20ES-blueviolet)

---

## ⭐ O diferencial — Coach Mode

A maioria dos sites de xadrez te dá **ou** o adversário **ou** a análise (e cobra pela última, ou exige login). Aqui, **rodam juntos no mesmo navegador**:

- Após cada jogada sua, o Stockfish (skill 20) reavalia a posição
- A jogada é classificada na hora — **Melhor / Boa / Imprecisão / Erro / Blunder** — com base na perda de centipawns
- A classificação aparece como badge no estado E inline no histórico
- Tudo offline, em milissegundos, sem custo, sem cadastro

Ou seja: você joga e revisa **na mesma tela**, sem ter que copiar o PGN pra outro site.

## ✨ Tudo que tem

- ♜ Tabuleiro com drag-and-drop
- 🤖 **Stockfish 18** rodando direto no navegador (Web Worker + WASM single-thread, sem precisar de COOP/COEP)
- 🎯 **Coach Mode** — classifica suas jogadas em tempo real (toggle)
- 🌍 **PT / EN / ES** com switch ao vivo no header
- 👤 Seu nome no jogo (vai pro PGN como `[White "..."]` / `[Black "..."]`)
- 🎚 6 níveis de dificuldade — do iniciante (skill 0) ao mestre (skill 20)
- 📊 Barra de avaliação em tempo real
- 🪦 Peças capturadas + diferença de material
- 📜 Lista de jogadas + export FEN / PGN num clique
- ↩️ Desfazer / reiniciar / trocar de lado
- 💾 Persiste preferências (idioma, nome, nível, lado, coach) no `localStorage`
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
| i18n | dicionário interno + React Context (sem dependência externa) |

O binário do Stockfish (~7 MB de `.wasm`) **não fica versionado**. Um script `postinstall` copia de `node_modules/stockfish/bin/` pra `public/stockfish/` toda vez que vc roda `bun install`.

## 🧠 Como o Coach Mode funciona

Quando você joga, o Coach faz duas avaliações curtas com Stockfish skill 20 (~300 ms cada):
posição **antes** da sua jogada e **depois**. A diferença de centipawns, vista do seu lado, vira a classificação:

| Perda (cp) | Classe |
|---|---|
| ≤ 15 | Melhor |
| ≤ 50 | Boa |
| ≤ 120 | Imprecisão |
| ≤ 280 | Erro |
| > 280 | Blunder |

Mate forçado contra você cai direto em Blunder.
O custo extra é pequeno (~600–700 ms por turno) e roda no mesmo Web Worker do oponente.

## 🌍 Deploy

Funciona em qualquer host estático que rode Node:

- **Vercel** — `vercel deploy`. Sem config extra. (É onde a demo roda.)
- **Cloudflare Pages** — build command `bun run build`, output `.next`.
- **Self-hosted** — `bun run build && bun start`.

> Como é single-threaded, **não precisa** dos headers `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` que o Stockfish multi-thread exige.

## 🗺 Roadmap

- [ ] Setas e highlights do último lance
- [ ] Promoção com modal de escolha (hoje promove sempre pra dama)
- [ ] Resumo final da partida (accuracy %, gráfico de eval)
- [ ] Modo "puzzle" com posições famosas
- [ ] Compartilhar partida via URL (PGN encodado)
- [ ] Versão multi-thread opcional pra quem servir com COOP/COEP

PRs bem-vindos. Issues também.

## 📄 Licença

MIT — veja [`LICENSE`](./LICENSE).

Stockfish é GPLv3 e é um binário separado servido como worker. Não é linkado estaticamente nesse repositório.
