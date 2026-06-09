import { useListBlogPosts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { ArrowRight, CalendarDays, Newspaper, Sparkles } from "lucide-react";

export default function Blog() {
  const { data, isLoading } = useListBlogPosts({ limit: 12 });

  return (
    <div className="container mx-auto px-4 py-16">
      <section className="mb-12 overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,hsl(214_90%_48%),hsl(223_45%_18%))] px-6 py-10 text-white shadow-[0_30px_80px_-40px_hsl(var(--primary)/0.8)] md:px-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/85">
            <Sparkles className="h-3.5 w-3.5" />
            Blog
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-5xl text-balance">
            Conseils de voyage, location et bonnes pratiques pour le Maroc.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/85">
            Articles courts et utiles pour préparer votre trajet, mieux choisir votre véhicule et gagner du temps lors de la réservation.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-white shadow-sm">
              <Skeleton className="h-[220px] w-full rounded-none" />
              <div className="space-y-4 p-6">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            </div>
          ))
        ) : data?.posts && data.posts.length > 0 ? (
          data.posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group h-full">
              <Card className="h-full overflow-hidden border-border/70 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_34px_70px_-34px_hsl(var(--primary)/0.28)]">
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
                  <h2 className="mt-3 text-xl font-bold tracking-tight transition-colors group-hover:text-primary line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-muted-foreground">{post.excerpt}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Lire l’article
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full rounded-[1.5rem] border border-dashed border-border/70 bg-white py-20 text-center text-muted-foreground">
            Aucun article n’a été publié pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
