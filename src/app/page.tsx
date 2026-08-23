import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HeroSearchBar } from "@/components/HeroSearchBar";
import { HomeCategories } from "@/components/HomeCategories";
import { HomeTrustStrip } from "@/components/HomeTrustStrip";
import { HomeResidences } from "@/components/HomeResidences";
import { HomeEvenementiel } from "@/components/HomeEvenementiel";
import { HomeRecentWorks } from "@/components/HomeRecentWorks";
import { HomeBlog } from "@/components/HomeBlog";
import { HomeTestimonials } from "@/components/HomeTestimonials";
import { Poles } from "@/components/Poles";
import { Platform } from "@/components/Platform";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { listPublicEquipment } from "@/lib/evenementiel-data";
import {
  getHomepageSection,
  listBlogPostsAdmin,
  listTestimonialsAdmin,
  listTravauxAdmin,
} from "@/lib/homepage-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [
    equipment,
    hero,
    categories,
    trust,
    poles,
    platform,
    blogPosts,
    testimonials,
    travaux,
  ] = await Promise.all([
    listPublicEquipment(),
    getHomepageSection("hero"),
    getHomepageSection("categories"),
    getHomepageSection("trust"),
    getHomepageSection("poles"),
    getHomepageSection("platform"),
    listBlogPostsAdmin(),
    listTestimonialsAdmin(),
    listTravauxAdmin(),
  ]);

  const featuredBlog = blogPosts
    .filter((p) => p.featured)
    .slice(0, 3);
  const blogPreview =
    featuredBlog.length > 0 ? featuredBlog : blogPosts.slice(0, 3);

  return (
    <>
      <Header />
      <main>
        <Hero content={hero} />
        <HeroSearchBar />
        <HomeCategories categories={categories} />
        <HomeTrustStrip stats={trust} />
        <HomeResidences />
        <HomeEvenementiel equipment={equipment} />
        <HomeRecentWorks items={travaux} />
        <Poles poles={poles} />
        <HomeBlog posts={blogPreview} />
        <HomeTestimonials items={testimonials} />
        <Platform content={platform} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
