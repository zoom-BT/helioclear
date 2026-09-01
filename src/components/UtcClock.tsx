"use client";

import { useEffect, useState } from "react";

function formatUtc(date: Date): string {
  return `${date.toISOString().slice(11, 19)} UTC`;
}

export default function UtcClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <time
      className="tabular-nums tracking-[0.18em] text-[color:var(--paper)]"
      dateTime={now?.toISOString()}
    >
      {now ? formatUtc(now) : "——:——:—— UTC"}
    </time>
  );
}
