import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HeroSearchBar } from "@/components/HeroSearchBar";
import { HomeCategories } from "@/components/HomeCategories";
import { HomeTrustStrip } from "@/components/HomeTrustStrip";
import { HomeResidences } from "@/components/HomeResidences";
import { HomeBoutique } from "@/components/HomeBoutique";
import { HomeEvenementiel } from "@/components/HomeEvenementiel";
import { HomeRecentWorks } from "@/components/HomeRecentWorks";
import { HomeBlog } from "@/components/HomeBlog";
import { HomeTestimonials } from "@/components/HomeTestimonials";
import { Poles } from "@/components/Poles";
import { HomeTeam, type TeamMember } from "@/components/HomeTeam";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { listPublicProducts } from "@/lib/boutique-data";
import { listPublicEquipment } from "@/lib/evenementiel-data";
import {
  getHomepageSection,
  listBlogPostsAdmin,
  listTestimonialsAdmin,
  listTravauxAdmin,
} from "@/lib/homepage-data";
import { listEmployees } from "@/lib/rh";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [
    equipment,
    products,
    hero,
    categories,
    trust,
    poles,
    blogPosts,
    testimonials,
    travaux,
    employees,
  ] = await Promise.all([
    listPublicEquipment(),
    listPublicProducts(),
    getHomepageSection("hero"),
    getHomepageSection("categories"),
    getHomepageSection("trust"),
    getHomepageSection("poles"),
    listBlogPostsAdmin(),
    listTestimonialsAdmin(),
    listTravauxAdmin(),
    listEmployees(),
  ]);

  const teamMembers: TeamMember[] = employees
    .filter((e) => e.status === "actif" || e.status === "essai")
    .map((e) => ({
      id: e.id,
      name: e.fullName,
      role: e.jobTitle,
      department: e.department,
      bio: e.notes || undefined,
    }));

  const featuredBlog = blogPosts.filter((p) => p.featured);
  const blogPreview =
    featuredBlog.length >= 4
      ? featuredBlog.slice(0, 4)
      : blogPosts.slice(0, 4);

  // Parcours : attirer → crédibiliser → orienter → offrir → prouver → convaincre → convertir
  return (
    <>
      <Header />
      <main>
        <Hero content={hero} />
        <HeroSearchBar />
        <HomeTrustStrip stats={trust} />
        <Poles poles={poles} />
        <HomeResidences />
        <HomeCategories categories={categories} />
        <HomeEvenementiel equipment={equipment} />
        <HomeBoutique products={products} />
        <HomeRecentWorks items={travaux} limit={5} />
        <HomeTestimonials items={testimonials} />
        <HomeBlog posts={blogPreview} />
        <HomeTeam members={teamMembers} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
