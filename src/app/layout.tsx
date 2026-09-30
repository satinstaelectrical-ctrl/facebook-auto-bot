import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Facebook Auto Bot",
  description: "Generate and auto-post optimized Facebook Page posts from any topic.",
};

// Runs before paint to apply the saved theme without a light->dark flash.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("pab-theme");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
