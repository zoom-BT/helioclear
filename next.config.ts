import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three", "@react-three/fiber"],
  // Allow both localhost and 127.0.0.1 so client JS hydrates in either origin.
  allowedDevOrigins: [
    "http://localhost:43147",
    "http://127.0.0.1:43147",
    "localhost",
    "127.0.0.1",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "services.swpc.noaa.gov",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "sdo.gsfc.nasa.gov",
        pathname: "/assets/**",
      },
    ],
  },
};

export default nextConfig;
