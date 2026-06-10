import { useEffect } from "react";

type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

type SeoProps = {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: "website" | "article" | "product";
  jsonLd?: JsonLd;
};

function upsertMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

export function Seo({ title, description, canonical, image = "/opengraph.jpg", type = "website", jsonLd }: SeoProps) {
  useEffect(() => {
    const fullTitle = title.includes("Location Auto Maroc") ? title : `${title} | Location Auto Maroc`;
    const resolvedImage =
      image.startsWith("http") || typeof window === "undefined"
        ? image
        : new URL(image, canonical || window.location.href).toString();

    document.title = fullTitle;

    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[property="og:type"]', "property", "og:type", type);
    upsertMeta('meta[property="og:image"]', "property", "og:image", resolvedImage);
    upsertMeta('meta[property="og:url"]', "property", "og:url", canonical || window.location.href);
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", resolvedImage);
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");

    if (canonical) {
      upsertLink("canonical", canonical);
    }

    const scriptId = "seo-jsonld";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (jsonLd) {
      const script = existing ?? document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(jsonLd);
      if (!existing) {
        document.head.appendChild(script);
      }
    } else if (existing) {
      existing.remove();
    }
  }, [canonical, description, image, jsonLd, title, type]);

  return null;
}
