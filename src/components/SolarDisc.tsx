"use client";

import { useLascoLoop, useSuviLoop } from "@/components/useFrameLoop";
import { useEffect } from "react";

export default function SolarDisc({
  credit,
  lasco,
  onFrame,
}: {
  credit: string;
  lasco: boolean;
  onFrame: (src: string) => void;
}) {
  const src = useSuviLoop();
  const lascoSrc = useLascoLoop(lasco);

  useEffect(() => {
    onFrame(src);
  }, [src, onFrame]);

  return (
    <figure className="solar-wrap">
      <div className="solar-disc">
        {/* Native img: live NOAA frame loop + onError fallback. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="GOES SUVI 171 Å solar disc animation, NOAA SWPC"
          width={1280}
          height={1280}
          onError={(event) => {
            event.currentTarget.src = "/imagery/suvi171.png";
          }}
        />
      </div>
      <figcaption className="solar-credit">{credit}</figcaption>
      {lascoSrc ? (
        <div className="lasco-strip">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lascoSrc} alt="" width={512} height={512} />
          <span>SOHO LASCO C3</span>
        </div>
      ) : null}
    </figure>
  );
}
