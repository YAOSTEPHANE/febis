import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { blogCategoryLabel, formatBlogDate } from "@/lib/blog";
import { listBlogPostsAdmin } from "@/lib/homepage-data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const posts = await listBlogPostsAdmin();
  const post = posts.find((p) => p.slug === slug);
  if (!post) return { title: "Article introuvable" };
  return {
    title: `${post.title} — Blog FEBiS`,
    description: post.excerpt,
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const posts = await listBlogPostsAdmin();
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <PublicHeader />
      <main>
        <article>
          <header className="relative min-h-[50svh] overflow-hidden bg-febis-ink pt-20">
            <div className="absolute inset-0">
              <Image
                src={post.image}
                alt={post.title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1210] via-[#1a1210]/55 to-[#1a1210]/35" />
            </div>
            <div className="relative mx-auto flex min-h-[50svh] max-w-3xl flex-col justify-end px-5 pb-12 md:px-8">
              <Link
                href="/blog"
                className="mb-6 text-sm font-bold text-white/70 hover:text-white"
              >
                ← Retour au blog
              </Link>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-febis-amber">
                {blogCategoryLabel(post.category)} · {formatBlogDate(post.date)} ·{" "}
                {post.readMinutes} min
              </p>
              <h1 className="mt-4 font-display text-[clamp(1.9rem,4.5vw,3.2rem)] font-extrabold leading-tight tracking-tight text-white">
                {post.title}
              </h1>
              <p className="mt-4 text-white/70">Par {post.author}</p>
            </div>
          </header>

          <div className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
            <p className="text-xl leading-relaxed text-febis-ink/70">{post.excerpt}</p>
            <div className="mt-10 space-y-6 text-base leading-relaxed text-febis-ink/80 md:text-lg">
              {post.content.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="border-t border-febis-ink/8 bg-white/40 py-14">
            <div className="mx-auto max-w-7xl px-5 md:px-8">
              <h2 className="font-display text-2xl font-bold text-febis-ink">
                À lire aussi
              </h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/blog/${item.slug}`}
                    className="rounded-2xl border border-febis-ink/8 bg-white/80 p-5 hover:border-febis-red/30"
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-febis-red">
                      {blogCategoryLabel(item.category)}
                    </p>
                    <p className="mt-2 font-display text-xl font-bold text-febis-ink">
                      {item.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
