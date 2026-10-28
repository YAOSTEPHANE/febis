import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClient(): MongoClient {
  if (!uri) {
    throw new Error(
      "MONGODB_URI manquant. Ajoutez-le dans .env.local (ex: mongodb://127.0.0.1:27017/febis).",
    );
  }

  return new MongoClient(uri, {
    // Atlas (TLS + replica set) often needs more than 2.5s on slow links.
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    // Keep serverless pools small — dashboard loads open many parallel getDb() calls.
    maxPoolSize: 10,
  });
}

function getClientPromise(): Promise<MongoClient> {
  // Reuse one client across warm serverless invocations (and HMR in dev).
  // Creating a new connect() per call exhausts Atlas connection limits on Vercel.
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createClient().connect();
  }
  return global._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB ?? "febis");
}
