import { useListBlogPosts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

export default function Blog() {
  const { data, isLoading } = useListBlogPosts({ limit: 12 });

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Notre Blog</h1>
        <p className="text-lg text-muted-foreground">
          Conseils, itinéraires et actualités sur la location de voitures et le tourisme au Maroc.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col h-[400px]">
              <Skeleton className="w-full h-[240px] rounded-t-xl" />
              <div className="p-6 space-y-4 border border-t-0 rounded-b-xl flex-1 bg-card">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))
        ) : data?.posts && data.posts.length > 0 ? (
          data.posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group h-full">
              <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                  {post.coverImage ? (
                    <img 
                      src={post.coverImage} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Aucune image
                    </div>
                  )}
                </div>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="text-sm text-muted-foreground mb-3">
                    {formatDateTime(post.createdAt).split(' ')[0]}
                  </div>
                  <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground line-clamp-3 mb-4 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="text-primary font-medium text-sm mt-auto">
                    Lire l'article →
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            Aucun article n'a été publié pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
