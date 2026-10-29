
import type { Metadata, Viewport } from "next";
import "./globals.css";

import UniversalFooter from "@/components/UniversalFooter";

export const metadata: Metadata = {
  title: "Whispr — Your space, your rules",
  description:
    "A little mystery, a lot of thoughts. Share your Whispr link and create beautiful anonymous Q&A stories.",
  applicationName: "Whispr",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Whispr",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0912",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <UniversalFooter />
      </body>
    </html>
  );
}
