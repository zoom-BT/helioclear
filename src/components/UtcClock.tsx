"use client";

import { useEffect, useState } from "react";

function formatUtc(now: Date): string {
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss} UTC`;
}

export default function UtcClock() {
  const [label, setLabel] = useState(() => formatUtc(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => setLabel(formatUtc(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <time className="clock" dateTime={new Date().toISOString()} suppressHydrationWarning>
      {label}
    </time>
  );
}
