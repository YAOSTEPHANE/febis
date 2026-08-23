import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { blogCategoryLabel, formatBlogDate } from "@/lib/blog";
import { listBlogPostsAdmin } from "@/lib/homepage-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog FEBiS — Conseils & actualités",
  description:
    "Articles FEBiS sur les résidences meublées, l’événementiel, le BTP et la vie d’entreprise en Côte d’Ivoire.",
};

export default async function BlogPage() {
  const posts = (await listBlogPostsAdmin()).sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  return (
    <>
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden bg-febis-ink pt-28 pb-16 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-febis-red/30 via-transparent to-febis-gold/20" />
          <div className="relative mx-auto max-w-7xl px-5 md:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-febis-amber">
              Blog FEBiS
            </p>
            <h1 className="mt-4 font-display max-w-3xl text-[clamp(2.2rem,5vw,3.8rem)] font-extrabold leading-[0.95] tracking-tight">
              Conseils, coulisses &{" "}
              <span className="text-gold-sheen">actualités</span>
            </h1>
            <p className="mt-5 max-w-xl text-white/75">
              Guides pratiques et retours d’expérience sur nos quatre pôles
              d’activité.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-2 md:px-8">
            {posts.map((post, index) => (
              <Reveal key={post.slug} delay={index * 0.06}>
                <article className="group overflow-hidden rounded-[1.35rem] border border-febis-ink/8 bg-white/70 shadow-[0_20px_50px_rgba(26,18,16,0.05)]">
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-febis-ink/45">
                        <span className="text-febis-red">
                          {blogCategoryLabel(post.category)}
                        </span>
                        <span>·</span>
                        <span>{formatBlogDate(post.date)}</span>
                        <span>·</span>
                        <span>{post.readMinutes} min</span>
                      </div>
                      <h2 className="mt-3 font-display text-2xl font-bold text-febis-ink">
                        {post.title}
                      </h2>
                      <p className="mt-3 text-febis-ink/60">{post.excerpt}</p>
                      <span className="mt-5 inline-block text-sm font-bold text-febis-red">
                        Lire l’article →
                      </span>
                    </div>
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
