import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Plus, Pencil, FileText, Tags } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  category?: string | null;
  tags?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt?: string;
  seoTitle?: string | null;
};

type BlogManageResponse = {
  posts: BlogPost[];
  total: number;
};

async function fetchManagePosts(): Promise<BlogManageResponse> {
  return customFetch<BlogManageResponse>("/api/blog/manage?limit=100");
}

export default function AdminBlog() {
  const [location] = useLocation();
  const basePath = location.startsWith("/agent") ? "/agent" : "/admin";
  const { data, isLoading } = useQuery({
    queryKey: ["blog-manage-posts"],
    queryFn: fetchManagePosts,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion du blog</h1>
          <p className="text-sm text-muted-foreground">Articles, catégories, tags et métadonnées SEO.</p>
        </div>
        <Link href={`${basePath}/blog/nouveau`}>
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Nouvel article
          </Button>
        </Link>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Article</th>
                <th className="px-6 py-4 font-medium">SEO</th>
                <th className="px-6 py-4 font-medium">Catégorie / Tags</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-6 py-4"><Skeleton className="h-5 w-64" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-44" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-36" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 inline-block" /></td>
                  </tr>
                ))
              ) : data?.posts && data.posts.length > 0 ? (
                data.posts.map((post) => (
                  <tr key={post.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="font-medium text-base mb-1">{post.title}</div>
                      <div className="text-muted-foreground text-xs">{post.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{post.seoTitle || post.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{post.excerpt || "Aucun extrait"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{post.category || "Conseils"}</Badge>
                        {post.tags ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Tags className="h-3.5 w-3.5" />
                            {post.tags}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Aucun tag</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(post.createdAt).toLocaleDateString("fr-MA")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${post.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" : post.status === "ARCHIVED" ? "bg-slate-100 text-slate-800" : "bg-amber-100 text-amber-800"}`}>
                        {post.status === "PUBLISHED" ? "Publié" : post.status === "ARCHIVED" ? "Archivé" : "Brouillon"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`${basePath}/blog/${post.id}`}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-2">
                    <Empty className="border-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><FileText /></EmptyMedia>
                        <EmptyTitle>Aucun article trouvé</EmptyTitle>
                        <EmptyDescription>Publiez votre premier article de blog pour informer vos clients.</EmptyDescription>
                      </EmptyHeader>
                      <Link href={`${basePath}/blog/nouveau`}>
                        <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Écrire un article</Button>
                      </Link>
                    </Empty>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
