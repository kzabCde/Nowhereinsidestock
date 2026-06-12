import "./globals.css";
import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { SearchModal } from "@/components/ui/SearchModal";

export const metadata: Metadata = {
  title: "NowhereInsideStock",
  description: "See the trend. Read the signal."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen overflow-x-hidden">
        <div className="flex min-h-screen flex-col overflow-x-hidden">
          <Header />
          <div className="flex-1 overflow-x-hidden pb-20 md:pb-0">{children}</div>
          <Footer />
        </div>
        <BottomNav />
        <SearchModal />
      </body>
    </html>
  );
}
