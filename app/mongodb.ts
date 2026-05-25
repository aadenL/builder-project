//object used to connect to MongoDB
import { MongoClient } from "mongodb";

//reads the MongoDB connction string from .env.local
const uri = process.env.MONGODB_URI;

//checking if MONGODB_URI exists, if it doesnt throw error
if (!uri) {
    throw new Error("Missing MONGODB in .env.local");
}

//creates a MongoDV client using the atlas connection string
const client = new MongoClient(uri);

//create function getDb
//whole function in total means connect to MongoDB Atlas and give access to the builder-project database.
export async function getDb() {
    //opens the connection to MongoDB
    await client.connect();

    //returns the database named "builder-project" 
    return client.db("builder-project");
}