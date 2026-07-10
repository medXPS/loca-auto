import { useEffect, useState } from "react";
import { useListBlogPosts } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { ArrowRight, CalendarDays, Newspaper, Search, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Seo } from "@/components/seo";
import { formatDateTime } from "@/lib/utils";

function getSearchParams() {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.search);
}

export default function Blog() {
  const [location, setLocation] = useLocation();
  const initialParams = getSearchParams();
  const initialSearch = initialParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [appliedSearch, setAppliedSearch] = useState(initialSearch);

  useEffect(() => {
    const next = getSearchParams();
    const nextSearch = next.get("search") || "";
    setSearchInput(nextSearch);
    setAppliedSearch(nextSearch);
  }, [location]);

  const { data, isLoading, isError } = useListBlogPosts({
    limit: 12,
    search: appliedSearch || undefined,
  });

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

  const applySearch = () => {
    const nextSearch = searchInput.trim();
    setAppliedSearch(nextSearch);
    setLocation(nextSearch ? `/blog?search=${encodeURIComponent(nextSearch)}` : "/blog");
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <Seo
        title="Blog"
        description="Conseils de location de voiture au Maroc, SEO et bonnes pratiques pour choisir le bon véhicule."
        canonical="/blog"
      />
      <section className="overflow-hidden rounded-[2rem] marketing-dark-panel marketing-grid px-5 py-8 text-white sm:px-6 md:px-8 md:py-10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] marketing-kicker marketing-pill">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Blog
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
            Conseils de voyage, location et bonnes pratiques pour le Maroc.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">
            Des articles courts et utiles pour préparer votre trajet, mieux choisir votre véhicule et gagner du temps au moment de la réservation.
          </p>
        </div>

        <form
          className="relative z-10 mt-8 rounded-[1.5rem] border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
          onSubmit={(event) => {
            event.preventDefault();
            applySearch();
          }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/85">
                <Search className="h-4 w-4" />
                Rechercher un article
              </label>
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Titre, catégorie, mot-clé ou tag"
                className="h-12 rounded-2xl border-white/15 bg-white/95 text-slate-900 placeholder:text-slate-500"
              />
            </div>
            <Button type="submit" className="h-12 rounded-2xl bg-white text-slate-900 hover:bg-white/90">
              Rechercher
            </Button>
          </div>
          {appliedSearch ? (
            <p className="mt-3 text-sm text-white/70">Résultats pour « {appliedSearch} ».</p>
          ) : null}
        </form>
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
        ) : isError ? (
          <div className="col-span-full rounded-[1.5rem] border border-destructive/20 bg-destructive/5 px-6 py-16 text-center">
            <h2 className="text-xl font-semibold text-destructive">Impossible de charger le blog pour le moment.</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Rafraîchissez la page ou revenez plus tard. Si le problème persiste, la source des articles n’est peut-être pas encore prête.
            </p>
          </div>
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
            {appliedSearch ? (
              <div className="space-y-3">
                <p>Aucun article ne correspond à votre recherche.</p>
                <Button
                  variant="outline"
                  className="rounded-full border-black/10 bg-white"
                  onClick={() => {
                    setSearchInput("");
                    setAppliedSearch("");
                    setLocation("/blog");
                  }}
                >
                  Réinitialiser
                </Button>
              </div>
            ) : (
              "Aucun article n’a été publié pour le moment."
            )}
          </div>
        )}
      </div>
    </div>
  );
}
