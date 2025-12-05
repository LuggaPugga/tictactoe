import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/solid-start/plugin/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
	experimental: {
		enableNativePlugin: true,
	},
	resolve: {
		tsconfigPaths: true,
	},
	build: {
		rolldownOptions: {
			treeshake: true,
			output: {
				assetFileNames: (assetInfo) => {
					if (assetInfo.names?.[0]?.endsWith(".css")) {
						return "assets/styles.css";
					}
					return "assets/[name]-[hash][extname]";
				},
			},
		},
	},
	plugins: [
		devtools(),
		nitro(),
		tanstackStart(),
		solidPlugin({ ssr: true }),
		tailwindcss(),
	],
});
