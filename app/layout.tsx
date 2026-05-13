import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NowhereInsideStock",
  description: "See the trend. Read the signal."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
