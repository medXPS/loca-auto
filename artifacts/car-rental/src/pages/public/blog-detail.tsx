import { useGetBlogPost, getGetBlogPostQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default function BlogDetail() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";
  
  const { data: post, isLoading } = useGetBlogPost(slug, { 
    query: { enabled: !!slug, queryKey: getGetBlogPostQueryKey(slug) } 
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Skeleton className="h-8 w-24 mb-8" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-4 w-32 mb-8" />
        <Skeleton className="h-[400px] w-full rounded-xl mb-8" />
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
        <h1 className="text-2xl font-bold mb-4">Article introuvable</h1>
        <Link href="/blog" className="text-primary hover:underline">
          Retour au blog
        </Link>
      </div>
    );
  }

  return (
    <article className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        Retour au blog
      </Link>

      <header className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
          {post.title}
        </h1>
        <p className="text-muted-foreground">
          Publié le {formatDateTime(post.createdAt).split(' ')[0]}
        </p>
      </header>

      {post.coverImage && (
        <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-12 bg-muted shadow-lg">
          <img 
            src={post.coverImage} 
            alt={post.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div 
        className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-a:text-primary"
        dangerouslySetInnerHTML={{ __html: post.content || "" }}
      />
    </article>
  );
}
