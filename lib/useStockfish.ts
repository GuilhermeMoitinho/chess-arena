"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type EngineStatus = "loading" | "ready" | "thinking" | "error";

export type EngineMove = {
  from: string;
  to: string;
  promotion?: string;
  uci: string;
};

export type Evaluation = {
  type: "cp" | "mate";
  value: number;
  whitePerspective: number;
};

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const resolverRef = useRef<((m: EngineMove | null) => void) | null>(null);
  const searchTurnRef = useRef<"w" | "b">("w");
  const [status, setStatus] = useState<EngineStatus>("loading");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  useEffect(() => {
    const worker = new Worker("/stockfish/stockfish.js");
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<string>) => {
      const line = typeof e.data === "string" ? e.data : "";
      if (line === "uciok") {
        worker.postMessage("isready");
        return;
      }
      if (line === "readyok") {
        setStatus("ready");
        return;
      }
      if (line.startsWith("info") && line.includes("score")) {
        const cp = line.match(/score cp (-?\d+)/);
        const mate = line.match(/score mate (-?\d+)/);
        const turn = searchTurnRef.current;
        if (cp) {
          const v = parseInt(cp[1], 10);
          setEvaluation({
            type: "cp",
            value: v,
            whitePerspective: turn === "w" ? v : -v,
          });
        } else if (mate) {
          const v = parseInt(mate[1], 10);
          const wp = turn === "w" ? (v > 0 ? 9999 : -9999) : v > 0 ? -9999 : 9999;
          setEvaluation({ type: "mate", value: v, whitePerspective: wp });
        }
        return;
      }
      if (line.startsWith("bestmove")) {
        const parts = line.split(/\s+/);
        const uci = parts[1];
        if (resolverRef.current) {
          if (!uci || uci === "(none)") {
            resolverRef.current(null);
          } else {
            resolverRef.current({
              from: uci.slice(0, 2),
              to: uci.slice(2, 4),
              promotion: uci.length > 4 ? uci.slice(4, 5) : undefined,
              uci,
            });
          }
          resolverRef.current = null;
        }
        setStatus("ready");
      }
    };

    worker.onerror = () => setStatus("error");
    worker.postMessage("uci");

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const findMove = useCallback(
    (fen: string, opts: { skill: number; movetimeMs: number }): Promise<EngineMove | null> => {
      const w = workerRef.current;
      if (!w) return Promise.resolve(null);
      setStatus("thinking");
      searchTurnRef.current = (fen.split(" ")[1] as "w" | "b") || "w";
      w.postMessage(`setoption name Skill Level value ${opts.skill}`);
      w.postMessage(`position fen ${fen}`);
      w.postMessage(`go movetime ${opts.movetimeMs}`);
      return new Promise(resolve => {
        resolverRef.current = resolve;
      });
    },
    []
  );

  const stop = useCallback(() => {
    workerRef.current?.postMessage("stop");
  }, []);

  const resetEvaluation = useCallback(() => setEvaluation(null), []);

  return { status, evaluation, findMove, stop, resetEvaluation };
}
