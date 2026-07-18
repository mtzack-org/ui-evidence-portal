import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "UI Evidence Portal", template: "%s · UI Evidence" },
  description: "Web, Android, and iOS UI test evidence across every run.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
