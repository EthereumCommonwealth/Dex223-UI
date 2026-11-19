import { useEffect, useState } from "react";

import { Book, exchangeBook } from "./book";

// Binance's public market-data hosts: no key, CORS open, and served where the main API
// is geo-restricted.
const STREAM = "wss://data-stream.binance.vision/ws";
const REST = "https://data-api.binance.vision/api/v3/depth";

export type BookStatus = "loading" | "live" | "polling" | "error";

interface Snapshot {
  bids: [string, string][];
  asks: [string, string][];
}

/**
 * Live top of book for a Binance pair such as ETHUSDT. Streams once a second; if the
 * stream fails (blocked WebSockets, a proxy), it polls the REST snapshot instead.
 */
export function useExchangeBook(pair: string | null, depth = 14) {
  const [book, setBook] = useState<Book | null>(null);
  const [status, setStatus] = useState<BookStatus>("loading");

  useEffect(() => {
    setBook(null);
    setStatus("loading");
    if (!pair || typeof window === "undefined") return;

    let closed = false;
    let heard = false;
    let poll: ReturnType<typeof setInterval> | null = null;
    let socket: WebSocket | null = null;

    const apply = (snapshot: Snapshot, next: BookStatus) => {
      if (closed) return;
      setBook(exchangeBook(snapshot.bids, snapshot.asks, depth));
      setStatus(next);
    };

    const startPolling = () => {
      if (poll || closed) return;
      const load = () =>
        fetch(`${REST}?symbol=${pair}&limit=20`)
          .then((r) => (r.ok ? (r.json() as Promise<Snapshot>) : Promise.reject(r.status)))
          .then((snapshot) => apply(snapshot, "polling"))
          .catch(() => !closed && setStatus((s) => (s === "polling" ? s : "error")));
      load();
      poll = setInterval(load, 3000);
    };

    try {
      socket = new WebSocket(`${STREAM}/${pair.toLowerCase()}@depth20@1000ms`);
      socket.onmessage = (event) => {
        heard = true;
        apply(JSON.parse(event.data) as Snapshot, "live");
      };
      socket.onerror = startPolling;
      socket.onclose = () => !closed && startPolling();
    } catch {
      startPolling();
    }
    // A stream that connects but never speaks is as good as a failed one.
    const watchdog = setTimeout(() => {
      if (!heard) startPolling();
    }, 6000);

    return () => {
      closed = true;
      clearTimeout(watchdog);
      if (poll) clearInterval(poll);
      socket?.close();
    };
  }, [pair, depth]);

  return { book, status };
}
