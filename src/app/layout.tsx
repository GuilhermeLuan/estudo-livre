import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { RegistrarSw } from "./registrar-sw";
import { SCRIPT_DO_TEMA } from "./tema";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], axes: ["opsz"] });

export const metadata: Metadata = {
  title: "Estudo Livre",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Estudo Livre" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DO_TEMA }} />
      </head>
      <body className="font-sans">
        {children}
        <RegistrarSw />
      </body>
    </html>
  );
}
