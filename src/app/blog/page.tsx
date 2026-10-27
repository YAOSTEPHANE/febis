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
  const [featured, ...rest] = posts;

  return (
    <>
      <PublicHeader />
      <main>
        <section className="list-hero relative min-h-[48svh]">
          {featured ? (
            <div className="absolute inset-0">
              <Image
                src={featured.image}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover ken-burns"
              />
              <div className="list-hero-overlay" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-febis-red/30 via-febis-ink to-febis-gold/20" />
          )}
          <div className="relative mx-auto flex min-h-[48svh] max-w-7xl flex-col justify-end px-5 pb-14 md:px-8 md:pb-16">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
              Accueil / Blog
            </p>
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

        <section className="section-pad">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            {featured ? (
              <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
                <Reveal>
                  <article className="group overflow-hidden rounded-[1.35rem]">
                    <Link href={`/blog/${featured.slug}`} className="relative block min-h-[340px] sm:min-h-[420px]">
                      <Image
                        src={featured.image}
                        alt={featured.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 60vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-febis-ink/90 via-febis-ink/30 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                        <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                          <span className="text-febis-amber">
                            {blogCategoryLabel(featured.category)}
                          </span>
                          <span>{formatBlogDate(featured.date)}</span>
                          <span>{featured.readMinutes} min</span>
                        </div>
                        <h2 className="mt-3 font-display text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
                          {featured.title}
                        </h2>
                        <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
                          {featured.excerpt}
                        </p>
                      </div>
                    </Link>
                  </article>
                </Reveal>

                <div className="flex flex-col gap-4">
                  {rest.map((post, index) => (
                    <Reveal key={post.slug} delay={index * 0.05}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="glass-panel is-interactive group flex gap-4 p-3 sm:p-4"
                      >
                        <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-32">
                          <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            sizes="128px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="min-w-0 flex-1 py-1">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-febis-orange">
                            {blogCategoryLabel(post.category)} · {formatBlogDate(post.date)}
                          </p>
                          <h2 className="mt-1 line-clamp-2 font-display text-lg font-bold text-febis-ink">
                            {post.title}
                          </h2>
                          <p className="mt-1 line-clamp-2 text-sm text-febis-ink/55">
                            {post.excerpt}
                          </p>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-febis-ink/55">Aucun article pour le moment.</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
