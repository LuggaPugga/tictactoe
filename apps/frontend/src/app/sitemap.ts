import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: `${process.env.NEXT_PUBLIC_APP_URL}`,
			lastModified: new Date(),
			priority: 1,
		},
		{
			url: `${process.env.NEXT_PUBLIC_APP_URL}/local-multiplayer`,
			lastModified: new Date(),
			priority: 0.8,
		},
	];
}
