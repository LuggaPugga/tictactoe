import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import React from "react"
import { GeistSans } from "geist/font/sans"

export const metadata: Metadata = {
  title: "TicTacToe - Play anywhere, anytime",
  description: "A modern TicTacToe game with online multiplayer, local play, and more",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen bg-background text-foreground">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
