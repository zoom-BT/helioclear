"use client";

import { useLascoLoop, useSuviLoop } from "@/components/useFrameLoop";
import { detectWebGL } from "@/lib/globe";
import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";

const HelioGlobe = dynamic(() => import("@/components/HelioGlobe"), {
  ssr: false,
});

class GlobeErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function SuviFlat({ src }: { src: string }) {
  return (
    // Native img: live NOAA frame loop + onError fallback.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="GOES SUVI 171 Å solar disc animation, NOAA SWPC"
      width={1280}
      height={1280}
      onError={(event) => {
        event.currentTarget.src = "/imagery/suvi171.png";
      }}
    />
  );
}

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
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    onFrame(src);
  }, [src, onFrame]);

  useEffect(() => {
    setWebgl(detectWebGL());
  }, []);

  const flat = <SuviFlat src={src} />;

  return (
    <figure className="solar-wrap">
      <div className="solar-disc">
        {flat}
        {webgl ? (
          <GlobeErrorBoundary fallback={null}>
            <HelioGlobe suviSrc={src} onContextLost={() => setWebgl(false)} />
          </GlobeErrorBoundary>
        ) : null}
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
