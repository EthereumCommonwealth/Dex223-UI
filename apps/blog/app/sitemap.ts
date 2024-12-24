import type { MetadataRoute } from "next";

const BASE_URL = "https://test-app.dex223.io";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dexRoutes = [
    {
      url: `${BASE_URL}/en/swap/`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 1,
      alternates: {
        languages: {},
      },
    },
    {
      url: `${BASE_URL}/en/pools/`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/en/add/`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/en/remove/`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/en/increase/`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/en/token-listing/`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/en/token-listing/add/`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/en/blog/`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
  ];
  const allRoutes = [...dexRoutes];

  const blogRes = await fetch(
    "https://api.dex223.io/v1/core/api/blog/list-slim?page=1&limit=100&skip=0",
  );
  const blogData: {
    data: {
      id: string;
      slug: string;
    }[];
  } = await blogRes.json();

  for (let i of blogData.data) {
    allRoutes.push({
      url: `${BASE_URL}/en/blog/${i.id}?slug=${i.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    });
  }

  return allRoutes;
}
