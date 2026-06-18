import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebOS — Web-Based Operating System",
  description: "A fully functional web-based operating system running entirely in your browser. Features draggable windows, file explorer, terminal, and more.",
  keywords: "web os, browser operating system, virtual desktop, web desktop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="antialiased" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
