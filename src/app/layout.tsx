import type { Metadata } from "next";
import { Hubot_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import ProvidersWrapper from "@/providers/providers-wrapper";

const fontSans = Hubot_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fontMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FlowForge - Unified Web2 & Web3 Automation Platform",
  description: "FlowForge is a powerful automation platform that connects Web2 systems and Web3 blockchains in one visual workflow builder. Build, automate, and scale without code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ProvidersWrapper>{children}</ProvidersWrapper>
      </body>
    </html>
  );
}
