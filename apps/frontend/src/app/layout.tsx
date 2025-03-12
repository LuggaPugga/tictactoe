import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import React from "react"
import { GeistSans } from "geist/font/sans"
import Script from "next/script"
import StructuredData from "@/components/seo/structured-data"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
}

export const metadata: Metadata = {
  title: "Ultimate TicTacToe - Play anywhere, anytime",
  description:
    "A modern TicTacToe game with online multiplayer and local play. Challenge friends in this strategic classic game.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://tictactoe.example.com"),
  authors: [{ name: "LuggaPugga" }],
  keywords: ["tictactoe", "ultimate tictactoe", "game", "multiplayer", "online game", "strategy game", "board game"],
  creator: "LuggaPugga",
  publisher: "LuggaPugga",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Ultimate TicTacToe - Play anywhere, anytime",
    description: "A modern TicTacToe game with online multiplayer, local play, and more",
    siteName: "Ultimate TicTacToe",
    images: [
      {
        url: "/api/og/general",
        width: 1200,
        height: 630,
        alt: "Ultimate TicTacToe Game Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ultimate TicTacToe - Play anywhere, anytime",
    description: "A modern TicTacToe game with online multiplayer, local play, and more",
    images: ["/api/og/general"],
    creator: "@LuggaPugga",
  },
  alternates: {
    canonical: "/",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {process.env.NEXT_PUBLIC_UMAMI_URL && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
        <Script
          defer
          src={process.env.NEXT_PUBLIC_UMAMI_URL}
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
        ></Script>
      )}
      <body className={`${GeistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen bg-background text-foreground">{children}</main>
        </ThemeProvider>
        <StructuredData />
      </body>
    </html>
  )
}
