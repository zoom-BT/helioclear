/** NASA Blue Marble (public domain) hosted at EARTH_BLUE_MARBLE. */

export const SUN_SPIN = 0.42;
export const EARTH_SPIN = -0.58;

/** Cameroon coast / Gulf of Guinea — GNSS channel marker. */
export const GULF_OF_GUINEA = { lat: 3.5, lon: 9.0 };

/**
 * Equirectangular map → Three.js SphereGeometry (Y-up).
 * lon 0° (Greenwich) sits on +X so a −π/2 Y rotation faces Africa to +Z.
 */
export function latLonToVector3(
  lat: number,
  lon: number,
  radius: number,
): { x: number; y: number; z: number } {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

export function detectWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false });
    return Boolean(gl);
  } catch {
    return false;
  }
}
