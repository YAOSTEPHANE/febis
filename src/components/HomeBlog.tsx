import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import {
  blogCategoryLabel,
  formatBlogDate,
  type BlogPost,
} from "@/lib/blog";

export function HomeBlog({ posts }: { posts: BlogPost[] }) {
  const [featured, ...rest] = posts;
  if (!featured) return null;

  return (
    <section id="blog" className="section-band-mist section-pad relative overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <Reveal>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
            <div className="max-w-2xl">
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-febis-red">
                Blog
              </p>
              <h2 className="font-display text-[1.7rem] font-extrabold tracking-tight text-febis-ink sm:text-3xl md:text-4xl">
                Lecture{" "}
                <span className="text-gold-sheen">éditoriale</span>
              </h2>
            </div>
            <Link href="/blog" className="text-sm font-bold text-febis-red hover:underline">
              Tous les articles →
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          <Reveal>
            <article className="group overflow-hidden rounded-[1.35rem]">
              <Link href={`/blog/${featured.slug}`} className="relative block min-h-[320px] sm:min-h-[400px]">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-febis-ink/90 via-febis-ink/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-febis-amber">
                    {blogCategoryLabel(featured.category)} · {formatBlogDate(featured.date)}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
                    {featured.title}
                  </h3>
                  <p className="mt-3 max-w-xl line-clamp-2 text-sm text-white/70 sm:text-base">
                    {featured.excerpt}
                  </p>
                </div>
              </Link>
            </article>
          </Reveal>

          <div className="flex flex-col gap-3">
            {rest.slice(0, 3).map((post, index) => (
              <Reveal key={post.slug} delay={0.06 + index * 0.05}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="glass-panel is-interactive group flex gap-3 p-3"
                >
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="96px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-febis-orange">
                      {blogCategoryLabel(post.category)} · {post.readMinutes} min
                    </p>
                    <h3 className="mt-1 line-clamp-2 font-display text-base font-bold text-febis-ink">
                      {post.title}
                    </h3>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
