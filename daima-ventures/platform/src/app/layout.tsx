import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daima Ventures - Empowering Agricultural Communities",
  description:
    "Transform your farming business with tailored financial solutions designed for Uganda's smallholder farmers and cooperatives.",
  icons: {
    icon: "/images/logo-default.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
