import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://cpq.kohronburton.com/sitemap.xml",
    host: "https://cpq.kohronburton.com",
  };
}
