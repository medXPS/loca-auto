import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUpdateBlogPost } from "@workspace/api-client-react";
import { useLocation, useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const blogSchema = z.object({
  title: z.string().min(2, "Titre requis"),
  slug: z.string().min(2, "Slug requis"),
  category: z.string().min(2, "Catégorie requise"),
  tags: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(10, "Contenu requis"),
  coverImage: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  ogImage: z.string().optional(),
  status: z.string().default("DRAFT"),
});

type BlogPost = z.infer<typeof blogSchema> & {
  id: number;
  updatedAt?: string;
};

type BlogManageResponse = {
  posts: BlogPost[];
  total: number;
};

async function fetchManagePosts(): Promise<BlogManageResponse> {
  const response = await fetch("/api/blog/manage?limit=100", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Impossible de charger les articles");
  }
  return response.json();
}

function makeSeoDescription(title: string, excerpt: string, content: string) {
  const base = excerpt.trim() || content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const text = base || title;
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

function makeSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export default function AdminEditBlogPost() {
  const [, params] = useRoute("/admin/blog/:id");
  const [, agentParams] = useRoute("/agent/blog/:id");
  const [location, setLocation] = useLocation();
  const basePath = location.startsWith("/agent") ? "/agent" : "/admin";
  const id = Number((params ?? agentParams)?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updatePost = useUpdateBlogPost();

  const { data, isLoading } = useQuery({
    queryKey: ["blog-manage-posts"],
    queryFn: fetchManagePosts,
  });

  const post = data?.posts.find((item) => item.id === id);

  const form = useForm<z.infer<typeof blogSchema>>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      slug: "",
      category: "Conseils",
      tags: "",
      excerpt: "",
      content: "",
      coverImage: "",
      seoTitle: "",
      seoDescription: "",
      ogImage: "",
      status: "DRAFT",
    },
  });

  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        slug: post.slug,
        category: post.category || "Conseils",
        tags: post.tags || "",
        excerpt: post.excerpt || "",
        content: post.content || "",
        coverImage: post.coverImage || "",
        seoTitle: post.seoTitle || "",
        seoDescription: post.seoDescription || "",
        ogImage: (post as any).ogImage || post.coverImage || "",
        status: post.status,
      });
    }
  }, [form, post]);

  const title = form.watch("title");
  const excerpt = form.watch("excerpt") || "";
  const content = form.watch("content") || "";

  const handleGenerateSeo = () => {
    const description = makeSeoDescription(title, excerpt, content);
    if (!form.getValues("seoTitle")) {
      form.setValue("seoTitle", title);
    }
    form.setValue("seoDescription", description);
    if (!form.getValues("ogImage")) {
      form.setValue("ogImage", form.getValues("coverImage") || "");
    }
    toast({ title: "SEO suggéré", description: "Les champs SEO ont été complétés automatiquement." });
  };

  const onSubmit = (values: z.infer<typeof blogSchema>) => {
    if (!post) return;
    updatePost.mutate(
      { id: post.id, data: values as any },
      {
        onSuccess: () => {
          toast({ title: "Article mis à jour" });
          queryClient.invalidateQueries({ queryKey: ["blog-manage-posts"] });
          setLocation(`${basePath}/blog`);
        },
        onError: (error: any) => {
          toast({ title: "Erreur", description: error.message, variant: "destructive" });
        },
      },
    );
  };

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Chargement...</div>;
  }

  if (!post) {
    return (
      <div className="p-6 space-y-4 text-center">
        <p className="text-muted-foreground">Article introuvable.</p>
        <Link href={`${basePath}/blog`}>
          <Button variant="outline">Retour au blog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href={`${basePath}/blog`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modifier l'article</h1>
          <p className="text-sm text-muted-foreground">Mettez à jour le contenu, les métadonnées SEO et la catégorie.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Édition SEO</CardTitle>
          <Button type="button" variant="outline" className="gap-2" onClick={handleGenerateSeo}>
            <Sparkles className="w-4 h-4" />
            Suggestion SEO
          </Button>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Titre</FormLabel><FormControl><Input {...field} onBlur={() => !form.getValues("slug") && form.setValue("slug", makeSlug(field.value))} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem><FormLabel>Slug (URL)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Catégorie</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="tags" render={({ field }) => (
                  <FormItem><FormLabel>Tags SEO</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="excerpt" render={({ field }) => (
                <FormItem><FormLabel>Extrait court</FormLabel><FormControl><Textarea className="h-24" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem><FormLabel>Contenu complet (HTML/Texte)</FormLabel><FormControl><Textarea className="h-64 font-mono text-sm" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="coverImage" render={({ field }) => (
                  <FormItem><FormLabel>Image de couverture (URL)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="ogImage" render={({ field }) => (
                  <FormItem><FormLabel>Image Open Graph (URL)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="seoTitle" render={({ field }) => (
                  <FormItem><FormLabel>SEO Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="seoDescription" render={({ field }) => (
                  <FormItem><FormLabel>Meta Description</FormLabel><FormControl><Textarea className="h-24" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="PUBLISHED">Publié</SelectItem>
                        <SelectItem value="DRAFT">Brouillon</SelectItem>
                        <SelectItem value="ARCHIVED">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end pt-6">
                <Button type="submit" disabled={updatePost.isPending}>
                  {updatePost.isPending ? "Mise à jour..." : "Enregistrer les modifications"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
