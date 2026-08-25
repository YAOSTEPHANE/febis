import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import {
  blogCategoryLabel,
  formatBlogDate,
  type BlogPost,
} from "@/lib/blog";

export function HomeBlog({ posts }: { posts: BlogPost[] }) {
  return (
    <section id="blog" className="relative overflow-hidden pt-8 pb-12 md:pt-10 md:pb-16">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-febis-gold/35 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
                Blog
              </p>
              <h2 className="font-display text-[1.7rem] font-extrabold tracking-tight text-febis-ink sm:text-3xl md:text-4xl">
                Conseils &{" "}
                <span className="text-gold-sheen">actualités</span>
              </h2>
              <p className="mt-3 text-sm text-febis-ink/65 sm:text-base">
                Résidences, événementiel, BTP et vie d’entreprise — les coulisses
                FEBiS.
              </p>
            </div>
            <Link
              href="/blog"
              className="text-sm font-bold text-febis-red hover:underline"
            >
              Voir tous les articles →
            </Link>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 md:mt-8 lg:grid-cols-3">
          {posts.map((post, index) => (
            <Reveal key={post.slug} delay={index * 0.08}>
              <article className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-febis-ink/8 bg-white/65 shadow-[0_20px_50px_rgba(26,18,16,0.05)] backdrop-blur-sm">
                <Link href={`/blog/${post.slug}`} className="flex h-full flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-febis-ink">
                      {blogCategoryLabel(post.category)}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-febis-ink/45">
                      {formatBlogDate(post.date)} · {post.readMinutes} min
                    </p>
                    <h3 className="mt-2 font-display text-xl font-bold leading-snug text-febis-ink">
                      {post.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-febis-ink/60">
                      {post.excerpt}
                    </p>
                    <span className="mt-5 text-sm font-bold text-febis-red transition-transform group-hover:translate-x-1">
                      Lire l’article →
                    </span>
                  </div>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
