import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { GeistSans } from "geist/font/sans";
import type React from "react";
import StructuredData from "@/components/seo/structured-data";
import { ThemeProvider } from "@/components/theme-provider";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#111111" },
	],
};

export const metadata: Metadata = {
	title: "Ultimate Tic Tac Toe — Play Online or Locally",
	description:
		"Play Ultimate Tic Tac Toe online or locally. Create private rooms, quick match globally, and enjoy a fast, strategic 9×9 board experience.",
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
	),
	authors: [{ name: "LuggaPugga" }],
	keywords: [
		"ultimate tic tac toe",
		"how to play ultimate tic tac toe",
		"ultimate tic tac toe online",
		"ultimate tic tac toe rules",
		"ultimate tic tac toe strategy",
		"play ultimate tic tac toe",
		"multiplayer board game",
	],
	creator: "LuggaPugga",
	publisher: "LuggaPugga",
	robots: {
		index: true,
		follow: true,
	},
	icons: {
		icon: "/favicon.ico",
		shortcut: "/favicon.ico",
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "/",
		title: "Ultimate Tic Tac Toe — Play Online or Locally",
		description:
			"Fast, strategic Ultimate Tic Tac Toe with global matchmaking and private rooms.",
		siteName: "Ultimate Tic Tac Toe",
	},
	twitter: {
		card: "summary_large_image",
		title: "Ultimate Tic Tac Toe — Play Online or Locally",
		description:
			"Play Ultimate Tic Tac Toe with friends or quick match globally.",
		creator: "@LuggaPugga",
	},
	alternates: {
		canonical: "/",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<Analytics />
			<body className={`${GeistSans.className} antialiased`}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<main className="min-h-screen bg-background text-foreground">
						{children}
					</main>
				</ThemeProvider>
				<StructuredData />
			</body>
		</html>
	);
}
