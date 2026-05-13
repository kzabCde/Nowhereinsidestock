import "./globals.css";
import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "NowhereInsideStock",
  description: "See the trend. Read the signal."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen"><div className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
      </div></body>
    </html>
  );
}
