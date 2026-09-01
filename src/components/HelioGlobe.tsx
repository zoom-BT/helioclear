"use client";

import { usePrefersReducedMotion } from "@/components/useFrameLoop";
import { EARTH_BLUE_MARBLE, SUVI_STATIC } from "@/lib/imagery";
import {
  EARTH_SPIN,
  GULF_OF_GUINEA,
  SUN_SPIN,
  latLonToVector3,
} from "@/lib/globe";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

function useSuviTexture(src: string): THREE.CanvasTexture {
  const canvas = useMemo(() => {
    const el = document.createElement("canvas");
    el.width = 1024;
    el.height = 1024;
    const ctx = el.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#140801";
      ctx.fillRect(0, 0, el.width, el.height);
    }
    return el;
  }, []);

  const texture = useMemo(() => {
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    map.needsUpdate = true;
    return map;
  }, [canvas]);

  useEffect(() => {
    let cancelled = false;
    const paint = (url: string, allowFallback: boolean) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (cancelled) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        texture.needsUpdate = true;
      };
      img.onerror = () => {
        if (cancelled || !allowFallback) return;
        paint(SUVI_STATIC, false);
      };
      img.src = url;
    };
    paint(src, src !== SUVI_STATIC);
    return () => {
      cancelled = true;
    };
  }, [src, canvas, texture]);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function useEarthTexture(): THREE.Texture {
  const texture = useMemo(() => {
    const map = new THREE.Texture();
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  }, []);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    let cancelled = false;
    loader.load(EARTH_BLUE_MARBLE, (loaded) => {
      if (cancelled) {
        loaded.dispose();
        return;
      }
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.anisotropy = 8;
      texture.image = loaded.image;
      texture.needsUpdate = true;
    });
    return () => {
      cancelled = true;
    };
  }, [texture]);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function GulfMarker({ radius }: { radius: number }) {
  const pos = latLonToVector3(GULF_OF_GUINEA.lat, GULF_OF_GUINEA.lon, radius * 1.03);
  return (
    <group position={[pos.x, pos.y, pos.z]}>
      <mesh>
        <sphereGeometry args={[radius * 0.048, 16, 16]} />
        <meshBasicMaterial color="#ffb020" />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 0.09, 16, 16]} />
        <meshBasicMaterial color="#ffb020" transparent opacity={0.28} />
      </mesh>
    </group>
  );
}

function HelioBodies({ suviSrc }: { suviSrc: string }) {
  const sun = useRef<THREE.Group>(null);
  const earth = useRef<THREE.Group>(null);
  const reduced = usePrefersReducedMotion();
  const suvi = useSuviTexture(suviSrc);
  const earthMap = useEarthTexture();

  useFrame((_, delta) => {
    if (reduced) return;
    if (sun.current) sun.current.rotation.y += delta * SUN_SPIN;
    if (earth.current) earth.current.rotation.y += delta * EARTH_SPIN;
  });

  return (
    <>
      <ambientLight intensity={0.26} color="#fff1dc" />
      <directionalLight position={[2.6, 1.7, 2.4]} intensity={1.65} color="#fff6e8" />
      <pointLight position={[-0.35, 0.15, 0.55]} intensity={2.35} color="#ffb056" distance={7} />

      <group position={[-0.4, 0.05, 0]} rotation={[0.11, 0, 0.07]}>
        <group ref={sun}>
          <mesh>
            <sphereGeometry args={[0.94, 64, 64]} />
            <meshStandardMaterial
              map={suvi}
              emissiveMap={suvi}
              emissive="#ff8a2a"
              emissiveIntensity={0.78}
              roughness={0.84}
              metalness={0}
            />
          </mesh>
          <mesh scale={1.06}>
            <sphereGeometry args={[0.94, 32, 32]} />
            <meshBasicMaterial
              color="#ff7a24"
              transparent
              opacity={0.15}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>

      <group position={[0.96, -0.1, -0.3]} rotation={[0.41, 0, 0.08]}>
        <group ref={earth} rotation={[0, -Math.PI / 2, 0]}>
          <mesh>
            <sphereGeometry args={[0.4, 64, 64]} />
            <meshStandardMaterial
              map={earthMap}
              roughness={0.46}
              metalness={0.1}
            />
          </mesh>
          <mesh scale={1.045}>
            <sphereGeometry args={[0.4, 32, 32]} />
            <meshBasicMaterial
              color="#6eb6ff"
              transparent
              opacity={0.18}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
          <GulfMarker radius={0.4} />
        </group>
      </group>
    </>
  );
}

export default function HelioGlobe({
  suviSrc,
  onContextLost,
}: {
  suviSrc: string;
  onContextLost?: () => void;
}) {
  return (
    <div
      className="helio-globe"
      role="img"
      aria-label="3D GOES SUVI 171 sun and NASA Blue Marble earth"
    >
      <Canvas
        camera={{ position: [0.24, 0.14, 3.55], fov: 34, near: 0.1, far: 24 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.75]}
        onCreated={({ gl }) => {
          gl.setClearColor(0x070604, 1);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          const canvas = gl.domElement;
          const lost = (event: Event) => {
            event.preventDefault();
            onContextLost?.();
          };
          canvas.addEventListener("webglcontextlost", lost, false);
        }}
      >
        <HelioBodies suviSrc={suviSrc} />
      </Canvas>
    </div>
  );
}
