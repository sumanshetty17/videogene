const UA = "ReelmindStudio/1.0 (educational film director)";

async function wikiJson(url: string) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

export async function researchTopic(query: string): Promise<{
  title: string;
  extract: string;
  url: string;
} | null> {
  const q = query.trim().slice(0, 140);
  if (!q) return null;
  try {
    const search = (await wikiJson(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=1&namespace=0&format=json&origin=*`,
    )) as [string, string[], string[], string[]];
    const title = search[1]?.[0];
    if (!title) return null;
    const page = (await wikiJson(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    )) as { title?: string; extract?: string; content_urls?: { desktop?: { page?: string } } };
    const extract = (page.extract || "").slice(0, 1800);
    if (!extract) return null;
    return {
      title: page.title || title,
      extract,
      url: page.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    };
  } catch {
    return null;
  }
}
