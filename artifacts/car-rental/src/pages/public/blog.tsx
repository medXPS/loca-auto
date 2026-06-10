import { useListBlogPosts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { ArrowRight, CalendarDays, Newspaper, Sparkles } from "lucide-react";
import { Seo } from "@/components/seo";

export default function Blog() {
  const { data, isLoading } = useListBlogPosts({ limit: 12 });
  const posts = (data?.posts ?? []) as Array<{
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    category?: string | null;
    tags?: string | null;
    coverImage?: string | null;
    createdAt: string;
  }>;

  return (
    <div className="container mx-auto px-4 py-10">
      <Seo
        title="Blog"
        description="Conseils de location de voiture au Maroc, SEO et bonnes pratiques pour choisir le bon véhicule."
        canonical="/blog"
      />
      <section className="overflow-hidden rounded-[2rem] marketing-dark-panel marketing-grid px-6 py-10 text-white md:px-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] marketing-kicker marketing-pill">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Blog
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            Conseils de voyage, location et bonnes pratiques pour le Maroc.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">
            Des articles courts et utiles pour préparer votre trajet, mieux choisir votre véhicule et gagner du temps au moment de la réservation.
          </p>
        </div>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[1.5rem] border border-black/8 bg-white shadow-sm">
              <Skeleton className="h-[220px] w-full rounded-none" />
              <div className="space-y-4 p-6">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            </div>
          ))
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group h-full">
              <Card className="h-full overflow-hidden border-black/8 bg-white/92 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_65px_-36px_rgba(16,23,34,0.22)]">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Newspaper className="h-10 w-10 opacity-50" />
                    </div>
                  )}
                </div>
                <CardContent className="flex h-full flex-col p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    {formatDateTime(post.createdAt).split(" ")[0]}
                  </div>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight transition-colors group-hover:text-primary line-clamp-2">
                    {post.title}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">{post.category || "Conseils"}</span>
                    {post.tags ? post.tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full border border-black/8 bg-white px-3 py-1 text-muted-foreground">
                        {tag.trim()}
                      </span>
                    )) : null}
                  </div>
                  <p className="mt-3 line-clamp-3 text-muted-foreground">{post.excerpt}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Lire l'article
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full rounded-[1.5rem] border border-dashed border-black/10 bg-white/88 py-20 text-center text-muted-foreground">
            Aucun article n'a été publié pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
