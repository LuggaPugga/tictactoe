import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: ["/", "/local-multiplayer"],
		},
		sitemap: `${process.env.NEXT_PUBLIC_APP_URL || "https://tictactoe.example.com"}/sitemap.xml`,
	};
}
