/// <reference types="vite/client" />
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/solid-router";
import { Suspense } from "solid-js";
import { HydrationScript } from "solid-js/web";
import { ThemeProvider } from "@/lib/theme";
import styleCss from "../styles.css?url";

export const Route = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{
				name: "title",
				title: "Ultimate Tic Tac Toe — Play Online or Locally",
			},
			{
				name: "description",
				content:
					"Play Ultimate Tic Tac Toe online or locally. Create private rooms, quick match globally, and enjoy a fast, strategic 9×9 board experience.",
			},
			{
				name: "keywords",
				content:
					"ultimate tic tac toe, online game, multiplayer, strategy game",
			},
			{ name: "author", content: "LuggaPugga" },
			{
				property: "og:title",
				content: "Ultimate Tic Tac Toe — Play Online or Locally",
			},
			{
				property: "og:description",
				content:
					"Fast, strategic Ultimate Tic Tac Toe with global matchmaking and private rooms.",
			},
			{ property: "og:type", content: "website" },
			{ name: "twitter:card", content: "summary_large_image" },
		],
		links: [
			{ rel: "stylesheet", href: styleCss },
			{ rel: "icon", href: "/favicon.ico" },
		],
		scripts: [
			{
				src: "https://assets.onedollarstats.com/stonks.js",
				defer: true,
			},
		],
	}),
	shellComponent: RootComponent,
});

function RootComponent() {
	return (
		<html lang="en" class="dark">
			<head>
				<HydrationScript />
				<HeadContent />
			</head>
			<body class="min-h-screen bg-background text-foreground antialiased">
				<ThemeProvider defaultTheme="system">
					<Suspense>
						<Outlet />
					</Suspense>
				</ThemeProvider>
				<Scripts />
			</body>
		</html>
	);
}
