import { useGetBlogPost, getGetBlogPostQueryKey } from "@workspace/api-client-react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, CalendarDays, Sparkles } from "lucide-react";
import { Seo } from "@/components/seo";

export default function BlogDetail() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";

  const { data: rawPost, isLoading } = useGetBlogPost(slug, {
    query: { enabled: !!slug, queryKey: getGetBlogPostQueryKey(slug) },
  });
  const post = rawPost as
    | {
        title: string;
        slug: string;
        excerpt?: string | null;
        content?: string | null;
        coverImage?: string | null;
        seoTitle?: string | null;
        seoDescription?: string | null;
        ogImage?: string | null;
        category?: string | null;
        tags?: string | null;
        createdAt: string;
      }
    | undefined;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Skeleton className="mb-8 h-8 w-24" />
        <Skeleton className="mb-4 h-14 w-3/4" />
        <Skeleton className="mb-8 h-4 w-40" />
        <Skeleton className="mb-8 h-[260px] w-full rounded-[2rem] sm:h-[420px]" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="mb-4 text-2xl font-semibold">Article introuvable</h1>
        <Link href="/blog" className="text-primary hover:underline">
          Retour au blog
        </Link>
      </div>
    );
  }

  const canonicalUrl =
    typeof window === "undefined" ? `/blog/${post.slug}` : `${window.location.origin}/blog/${post.slug}`;

  return (
    <article className="container mx-auto px-4 py-12">
      <Seo
        title={post.seoTitle || post.title}
        description={post.seoDescription || post.excerpt || post.title}
        canonical={`/blog/${post.slug}`}
        image={post.ogImage || post.coverImage || "/opengraph.jpg"}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.seoTitle || post.title,
          description: post.seoDescription || post.excerpt || post.title,
          image: post.ogImage || post.coverImage || "/opengraph.jpg",
          datePublished: post.createdAt,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": canonicalUrl,
          },
        }}
      />
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au blog
      </Link>

      <header className="mb-10 overflow-hidden rounded-[2rem] marketing-dark-panel marketing-grid px-5 py-8 text-white sm:px-6 md:px-10 md:py-10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] marketing-kicker marketing-pill">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Article
          </div>
          <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl md:text-5xl">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/76">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Publié le {formatDateTime(post.createdAt).split(" ")[0]}
            </span>
            {post.category && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em]">
                {post.category}
              </span>
            )}
          </div>
          {post.tags && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 6).map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-white/72">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {post.coverImage && (
        <div className="mb-12 overflow-hidden rounded-[2rem] border border-black/8 bg-muted shadow-[0_24px_60px_-34px_rgba(16,23,34,0.18)]">
          <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="marketing-soft-panel">
          <CardContent className="p-6">
            <div
              className="prose prose-lg max-w-none prose-headings:font-semibold prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: post.content || "" }}
            />
          </CardContent>
        </Card>

        <Card className="surface-panel-strong h-fit overflow-hidden">
          <div className="marketing-dark-panel px-6 py-7 text-white">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] marketing-kicker marketing-pill">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Conseil rapide
            </div>
            <h2 className="mt-5 text-2xl font-semibold leading-tight text-balance">
              Prenez quelques minutes pour comparer avant de valider.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              Les meilleures décisions viennent souvent d'une lecture rapide de plusieurs offres, avec un vrai aperçu du prix et des conditions.
            </p>
          </div>

          <CardContent className="space-y-4 p-6">
            <div className="rounded-2xl border border-black/8 bg-white/88 p-4 text-sm leading-7 text-muted-foreground">
              <p className="font-semibold text-foreground">Pourquoi ce sujet est utile</p>
              <p className="mt-2">
                Chaque article vous aide à mieux comprendre le parcours, à éviter les erreurs courantes et à réserver plus sereinement.
              </p>
            </div>

            <Link href="/voitures">
              <Button className="w-full rounded-full marketing-accent-button">
                Voir les voitures
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </article>
  );
}
