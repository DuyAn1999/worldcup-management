import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "World Cup Control",
  description: "Follow every match and every road to the World Cup final.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
