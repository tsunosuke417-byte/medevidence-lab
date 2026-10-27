import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedEvidence Lab | 根拠からたどる医学文献検索",
  description: "PubMedの公開文献を根拠付きで整理する、医学生向け学習支援プロトタイプ。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
