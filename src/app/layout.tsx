import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "HelioClear — space-weather operations desk",
  description:
    "GO / CONDITIONAL / NO-GO for launch and equatorial GNSS/HF over Cameroon and the Gulf of Guinea. Live NOAA SWPC. Educational prototype, not certified.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${mono.variable} antialiased`}>{children}</body>
    </html>
  );
}
