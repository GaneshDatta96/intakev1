import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { GlobalHeader } from "@/components/layout/header";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Intake V1",
  description:
    "AI-assisted clinical intake, structured assessment, and SOAP drafting for outpatient wellness clinics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <GlobalHeader />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
