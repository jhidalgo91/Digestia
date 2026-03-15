import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DigestAI – Nutrición Inteligente",
  description:
    "Aplicación de nutrición personalizada con seguimiento de dieta, hábitos, suplementación y análisis con IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
