import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { GlobalFooter } from "@/components/layout/footer";
import { GlobalHeader } from "@/components/layout/header";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
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
      className={`${plusJakartaSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-gray-50 text-[15.5px] text-[color:var(--foreground)]">
        <GlobalHeader />
        <main className="flex-1 flex flex-col">{children}</main>
        <GlobalFooter />
      </body>
    </html>
  );
}
