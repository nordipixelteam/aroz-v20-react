import { MongoClient } from 'mongodb';
import 'server-only';

const globalForMongo = globalThis;

export function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.startsWith('<')) {
    throw new Error('Set MONGODB_URI in the local environment before connecting.');
  }

  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo.mongoClientPromise = client.connect().catch(error => {
      globalForMongo.mongoClientPromise = undefined;
      throw error;
    });
  }

  return globalForMongo.mongoClientPromise;
}

export async function getMongoDb() {
  const client = await getMongoClient();
  const database = process.env.MONGODB_DB;
  if (!database) throw new Error('MONGODB_DB is required; refusing to choose a database implicitly.');
  return client.db(database);
}