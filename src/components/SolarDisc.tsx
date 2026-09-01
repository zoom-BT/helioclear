"use client";

export const LIVE_SUVI_171 =
  "https://services.swpc.noaa.gov/images/animations/suvi/primary/171/latest.png";
export const FALLBACK_SUVI_171 = "/imagery/suvi171.png";

export default function SolarDisc({
  src,
  credit,
  onError,
}: {
  src: string;
  credit: string;
  onError: () => void;
}) {
  return (
    <figure className="solar-wrap">
      <div className="solar-disc">
        <img
          src={src}
          alt="GOES SUVI 171 Å solar disc, NOAA SWPC"
          width={1280}
          height={1280}
          onError={onError}
        />
      </div>
      <figcaption className="solar-credit">{credit}</figcaption>
    </figure>
  );
}
