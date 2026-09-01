"use client";

import { usePrefersReducedMotion } from "@/components/useFrameLoop";
import { EARTH_BLUE_MARBLE, SUVI_STATIC } from "@/lib/imagery";
import {
  EARTH_SPIN,
  GULF_OF_GUINEA,
  SUN_SPIN,
  latLonToVector3,
} from "@/lib/globe";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
        ctx.fillStyle = "#1a0800";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Crop into the circular SUVI disc so plasma wraps the sphere, not a stamp on black.
        const scale = 1.55;
        const dw = canvas.width * scale;
        const dh = canvas.height * scale;
        ctx.drawImage(
          img,
          (canvas.width - dw) / 2,
          (canvas.height - dh) / 2 - canvas.height * 0.06,
          dw,
          dh,
        );
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

function useEarthTexture(): THREE.Texture | null {
  const [map, setMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    let cancelled = false;
    let loaded: THREE.Texture | null = null;
    loader.load(
      EARTH_BLUE_MARBLE,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        loaded = tex;
        setMap(tex);
      },
    );
    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, []);

  return map;
}

function GulfMarker({ radius }: { radius: number }) {
  const pos = latLonToVector3(GULF_OF_GUINEA.lat, GULF_OF_GUINEA.lon, radius * 1.035);
  return (
    <group position={[pos.x, pos.y, pos.z]}>
      <mesh>
        <sphereGeometry args={[radius * 0.045, 16, 16]} />
        <meshBasicMaterial color="#ffb020" />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 0.085, 16, 16]} />
        <meshBasicMaterial color="#ffb020" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function AimCamera() {
  const camera = useThree((state) => state.camera);
  useLayoutEffect(() => {
    camera.lookAt(0.08, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
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
      <AimCamera />
      <ambientLight intensity={0.38} color="#fff4e4" />
      <directionalLight position={[2.8, 1.4, 2.6]} intensity={2.15} color="#fff7ee" />
      <directionalLight position={[-2.2, 0.4, 1.2]} intensity={0.45} color="#ffb56a" />
      <pointLight position={[-0.2, 0.1, 0.8]} intensity={1.8} color="#ffc078" distance={6} />

      <group position={[-0.34, 0.04, 0]} rotation={[0.14, 0, 0.08]}>
        <group ref={sun}>
          <mesh>
            <sphereGeometry args={[0.82, 64, 64]} />
            <meshStandardMaterial
              map={suvi}
              emissiveMap={suvi}
              color="#fff3d6"
              emissive="#ff8a2a"
              emissiveIntensity={0.62}
              roughness={0.78}
              metalness={0}
            />
          </mesh>
          <mesh scale={1.055}>
            <sphereGeometry args={[0.82, 32, 32]} />
            <meshBasicMaterial
              color="#ff7a24"
              transparent
              opacity={0.16}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>

      <group position={[0.72, -0.06, 0.08]} rotation={[0.41, 0, 0.1]}>
        <group ref={earth} rotation={[0, -Math.PI / 2, 0]}>
          <mesh>
            <sphereGeometry args={[0.42, 64, 64]} />
            <meshStandardMaterial
              map={earthMap ?? undefined}
              color={earthMap ? "#ffffff" : "#2a6fbb"}
              roughness={0.42}
              metalness={0.12}
            />
          </mesh>
          <mesh scale={1.05}>
            <sphereGeometry args={[0.42, 32, 32]} />
            <meshBasicMaterial
              color="#6eb6ff"
              transparent
              opacity={0.2}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
          <GulfMarker radius={0.42} />
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
        camera={{ position: [0.18, 0.2, 3.15], fov: 36, near: 0.1, far: 24 }}
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
