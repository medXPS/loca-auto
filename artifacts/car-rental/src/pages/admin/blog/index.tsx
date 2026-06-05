import { useListBlogPosts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Edit, FileText } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminBlog() {
  const { data, isLoading } = useListBlogPosts({ limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Articles du Blog</h1>
        <Link href="/admin/blog/nouveau">
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
                      {new Date(post.createdAt).toLocaleDateString("fr-MA")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${post.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {post.status === "PUBLISHED" ? "Publié" : "Brouillon"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-2">
                    <Empty className="border-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><FileText /></EmptyMedia>
                        <EmptyTitle>Aucun article trouvé</EmptyTitle>
                        <EmptyDescription>Publiez votre premier article de blog pour informer vos clients.</EmptyDescription>
                      </EmptyHeader>
                      <Link href="/admin/blog/nouveau">
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
