//object used to connect to MongoDB
import { MongoClient } from "mongodb";

//reads the MongoDB connction string from .env.local
const uri = process.env.MONGODB_URI;

//checking if MONGODB_URI exists, if it doesnt throw error
if (!uri) {
    throw new Error("Missing MONGODB_URI in .env.local"); // Gives a clear error if the connection string is missing.
}

const mongoUri: string = uri;

// Keep the connection promise on globalThis so Next.js development hot reloads do
// not create competing MongoClient instances while replacing server modules.
const globalForMongo = globalThis as typeof globalThis & {
    mongoClientPromise?: Promise<MongoClient>;
};

function getClientPromise() {
    if (!globalForMongo.mongoClientPromise) {
        const client = new MongoClient(mongoUri);
        globalForMongo.mongoClientPromise = client.connect().catch((error) => {
            // Allow a later request to retry if the initial connection fails.
            delete globalForMongo.mongoClientPromise;
            throw error;
        });
    }

    return globalForMongo.mongoClientPromise;
}

//create function getDb
//whole function in total means connect to MongoDB Atlas and give access to the builder-project database.
export async function getDb() {
    //opens the connection to MongoDB
    const connectedClient = await getClientPromise(); // Waits for the shared MongoDB client to connect.

    //returns the database named "builder-project" 
    return connectedClient.db("builder-project"); // Gives the app access to the builder-project database.
}
