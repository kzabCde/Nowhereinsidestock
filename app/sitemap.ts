import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nowhereinsidestock.vercel.app";

const routes = ["", "/screener", "/rankings", "/portfolio", "/watchlist", "/compare", "/alerts", "/disclaimer"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/screener" || route === "/rankings" ? 0.9 : 0.7
  }));
}
