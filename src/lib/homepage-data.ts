import type { Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import {
  HOMEPAGE_DEFAULTS,
  type HomepageKey,
  type HomepagePayloadMap,
} from "@/lib/homepage-content";
import { BLOG_POSTS, type BlogPost } from "@/lib/blog";
import { TESTIMONIALS, type Testimonial } from "@/lib/temoignages";
import { RECENT_WORKS, type RecentWork } from "@/lib/travaux";

async function tryDb(): Promise<Db | null> {
  try {
    return await Promise.race([
      getDb(),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 3000);
      }),
    ]);
  } catch {
    return null;
  }
}

type HomepageDoc = {
  key: HomepageKey;
  data: HomepagePayloadMap[HomepageKey];
  updatedAt: Date;
};

export async function getHomepageSection<K extends HomepageKey>(
  key: K,
): Promise<HomepagePayloadMap[K]> {
  const db = await tryDb();
  if (!db) return HOMEPAGE_DEFAULTS[key];

  try {
    const doc = await db.collection<HomepageDoc>("homepage").findOne({ key });
    if (!doc?.data) return HOMEPAGE_DEFAULTS[key];
    return doc.data as HomepagePayloadMap[K];
  } catch {
    return HOMEPAGE_DEFAULTS[key];
  }
}

export async function saveHomepageSection<K extends HomepageKey>(
  key: K,
  data: HomepagePayloadMap[K],
): Promise<HomepagePayloadMap[K]> {
  const db = await getDb();
  const now = new Date();
  await db.collection("homepage").updateOne(
    { key },
    { $set: { key, data, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
  return data;
}

export async function listBlogPostsAdmin(): Promise<BlogPost[]> {
  const db = await tryDb();
  if (!db) return BLOG_POSTS;

  try {
    const docs = await db
      .collection<BlogPost>("blogPosts")
      .find({})
      .sort({ date: -1 })
      .limit(100)
      .toArray();
    return docs.length > 0 ? docs : BLOG_POSTS;
  } catch {
    return BLOG_POSTS;
  }
}

export async function upsertBlogPost(post: BlogPost): Promise<BlogPost> {
  const db = await getDb();
  const now = new Date();
  await db.collection("blogPosts").updateOne(
    { slug: post.slug },
    { $set: { ...post, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
  return post;
}

export async function deleteBlogPost(slug: string): Promise<void> {
  const db = await getDb();
  await db.collection("blogPosts").deleteOne({ slug });
}

export async function listTestimonialsAdmin(): Promise<Testimonial[]> {
  const db = await tryDb();
  if (!db) return TESTIMONIALS;

  try {
    const docs = await db
      .collection<Testimonial>("testimonials")
      .find({})
      .limit(100)
      .toArray();
    return docs.length > 0 ? docs : TESTIMONIALS;
  } catch {
    return TESTIMONIALS;
  }
}

export async function upsertTestimonial(
  item: Testimonial,
): Promise<Testimonial> {
  const db = await getDb();
  const now = new Date();
  await db.collection("testimonials").updateOne(
    { id: item.id },
    { $set: { ...item, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
  return item;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const db = await getDb();
  await db.collection("testimonials").deleteOne({ id });
}

export async function listTravauxAdmin(): Promise<RecentWork[]> {
  const db = await tryDb();
  if (!db) return RECENT_WORKS;

  try {
    const docs = await db
      .collection<RecentWork>("travaux")
      .find({})
      .limit(100)
      .toArray();
    return docs.length > 0 ? docs : RECENT_WORKS;
  } catch {
    return RECENT_WORKS;
  }
}

export async function upsertTravail(item: RecentWork): Promise<RecentWork> {
  const db = await getDb();
  const now = new Date();
  await db.collection("travaux").updateOne(
    { id: item.id },
    { $set: { ...item, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
  return item;
}

export async function deleteTravail(id: string): Promise<void> {
  const db = await getDb();
  await db.collection("travaux").deleteOne({ id });
}

export async function seedHomepageDefaults(): Promise<void> {
  const db = await getDb();
  const now = new Date();

  for (const key of Object.keys(HOMEPAGE_DEFAULTS) as HomepageKey[]) {
    await db.collection("homepage").updateOne(
      { key },
      {
        $setOnInsert: {
          key,
          data: HOMEPAGE_DEFAULTS[key],
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true },
    );
  }

  for (const post of BLOG_POSTS) {
    await db.collection("blogPosts").updateOne(
      { slug: post.slug },
      { $setOnInsert: { ...post, createdAt: now, updatedAt: now } },
      { upsert: true },
    );
  }

  for (const item of TESTIMONIALS) {
    await db.collection("testimonials").updateOne(
      { id: item.id },
      { $setOnInsert: { ...item, createdAt: now, updatedAt: now } },
      { upsert: true },
    );
  }

  for (const item of RECENT_WORKS) {
    await db.collection("travaux").updateOne(
      { id: item.id },
      { $setOnInsert: { ...item, createdAt: now, updatedAt: now } },
      { upsert: true },
    );
  }
}
