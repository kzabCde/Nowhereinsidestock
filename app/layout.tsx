import "./globals.css";
import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "NowhereInsideStock",
  description: "See the trend. Read the signal."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen overflow-x-hidden"><div className="flex min-h-screen flex-col overflow-x-hidden">
        <Header />
        <div className="flex-1 overflow-x-hidden">{children}</div>
        <Footer />
      </div></body>
    </html>
  );
}
