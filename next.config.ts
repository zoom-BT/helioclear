import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow both localhost and 127.0.0.1 so client JS hydrates in either origin.
  allowedDevOrigins: [
    "http://localhost:43147",
    "http://127.0.0.1:43147",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
