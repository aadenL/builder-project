//object used to connect to MongoDB
import { MongoClient } from "mongodb";

//reads the MongoDB connction string from .env.local
const uri = process.env.MONGODB_URI;

//checking if MONGODB_URI exists, if it doesnt throw error
if (!uri) {
    throw new Error("Missing MONGODB_URI in .env.local"); // Gives a clear error if the connection string is missing.
}

// Creates the MongoDB client once using the Atlas connection string.
const client = new MongoClient(uri); // Builds the MongoDB client from your Atlas URI.

// Stores the active connection Promise so hot reloads/requests can reuse the same connection.
let clientPromise: Promise<MongoClient> | null = null; // Starts empty until the first database request happens.

//create function getDb
//whole function in total means connect to MongoDB Atlas and give access to the builder-project database.
export async function getDb() {
    // Only connect the first time the app actually needs the database.
    if (!clientPromise) { // Checks whether a MongoDB connection has already been started.
        clientPromise = client.connect(); // Starts the connection and saves the Promise for reuse.
    }

    //opens the connection to MongoDB
    const connectedClient = await clientPromise; // Waits for the MongoDB client to finish connecting.

    //returns the database named "builder-project" 
    return connectedClient.db("builder-project"); // Gives the app access to the builder-project database.
}
