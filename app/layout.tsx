import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Model360 | Anúncios e Perfis em Destaque",
    template: "%s | Model360",
  },
  description:
    "Plataforma Model360 para criar e gerenciar anúncios com visibilidade, praticidade e segurança. Acesse sua conta, publique seu perfil e acompanhe seus destaques.",
  applicationName: "Model360",
  keywords: [
    "Model360",
    "anúncios",
    "perfis em destaque",
    "publicar anúncio",
    "plataforma de anúncios",
  ],
  openGraph: {
    title: "Model360 | Anúncios e Perfis em Destaque",
    description:
      "Crie e gerencie seus anúncios na Model360 com mais visibilidade e agilidade.",
    url: "https://model360.com.br",
    siteName: "Model360",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-white">
        {children}
      </body>
    </html>
  );
}