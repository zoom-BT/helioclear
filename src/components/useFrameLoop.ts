"use client";

import {
  LASCO_MANIFEST,
  LIVE_FRAME_COUNT,
  LOCAL_SUVI_LOOP,
  LOOP_MS,
  SUVI_GIF,
  SUVI_LATEST,
  SUVI_MANIFEST,
  SUVI_STATIC,
  urlsFromManifest,
} from "@/lib/imagery";
import { useEffect, useState } from "react";

function loadImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

async function preload(urls: string[]): Promise<string[]> {
  const ok = await Promise.all(urls.map(loadImage));
  return urls.filter((_, i) => ok[i]);
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

export function useSuviLoop(): string {
  const [frames, setFrames] = useState<string[]>([SUVI_LATEST]);
  const [index, setIndex] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const res = await fetch(SUVI_MANIFEST, { cache: "no-store" });
        if (!res.ok) throw new Error("manifest");
        const urls = urlsFromManifest(await res.json(), LIVE_FRAME_COUNT);
        if (urls.length < 2) throw new Error("short");

        const ready: string[] = [];
        for (const url of urls) {
          if (cancelled) return;
          if (!(await loadImage(url))) continue;
          ready.push(url);
          if (ready.length === 4) setFrames([...ready]);
        }
        if (cancelled) return;
        if (ready.length >= 2) {
          setFrames(ready);
          return;
        }
        throw new Error("preload");
      } catch {
        if (cancelled) return;
        const local = await preload(LOCAL_SUVI_LOOP);
        if (cancelled) return;
        if (local.length >= 2) {
          setFrames(local);
          return;
        }
        if (await loadImage(SUVI_LATEST)) {
          setFrames([SUVI_LATEST]);
          return;
        }
        if (await loadImage(SUVI_GIF)) {
          setFrames([SUVI_GIF]);
          return;
        }
        setFrames([SUVI_STATIC]);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reduced || frames.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % frames.length);
    }, LOOP_MS);
    return () => window.clearInterval(id);
  }, [frames, reduced]);

  return frames[index % frames.length] ?? SUVI_STATIC;
}

export function useLascoLoop(active: boolean): string | null {
  const [frames, setFrames] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!active) {
      setFrames([]);
      return;
    }
    let cancelled = false;

    async function boot() {
      try {
        const res = await fetch(LASCO_MANIFEST, { cache: "no-store" });
        if (!res.ok) return;
        const urls = urlsFromManifest(await res.json(), 12);
        const ready = await preload(urls);
        if (!cancelled && ready.length >= 2) setFrames(ready);
      } catch {
        /* LASCO is optional — stay hidden */
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    if (!active || reduced || frames.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % frames.length);
    }, LOOP_MS);
    return () => window.clearInterval(id);
  }, [active, frames, reduced]);

  if (!active || frames.length === 0) return null;
  return frames[index % frames.length] ?? null;
}
