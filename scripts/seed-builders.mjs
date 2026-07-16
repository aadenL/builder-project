// lets code interact with the files on my pc, built in node.js model
import fs from "node:fs";
// lets you access file and folder paths, built in node.js model
import path from "node:path";
// used to get information on different things
import process from "node:process";
import { MongoClient } from "mongodb";

// Builds the absolute path to your local environment file.
// combines the path of where this project is in my pc with .env.local and stores it in envPath
const envPath = path.join(process.cwd(), ".env.local");

// Checks whether .env.local exists before trying to read it.
// existsSync just checks if the file that inputted exists, in this case the .env.local
if (fs.existsSync(envPath)) {
  // Reads the whole .env.local file as plain text, since utf8 is given it returns a string
  // utf8 is character encoding, basically converts computer language (bytes) into human readable language
  const envFile = fs.readFileSync(envPath, "utf8");

  // Loops through each line so we can manually load environment variables.
  for (const line of envFile.split(/\r?\n/)) {
    // Removes extra spaces from the start and end of the line.
    const trimmedLine = line.trim();

    // Skips blank lines and comments.
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    // Finds the first equals sign, which separates the env var name from its value.
    const equalsIndex = trimmedLine.indexOf("=");

    // Skips lines that do not look like KEY=value.
    if (equalsIndex === -1) {
      continue;
    }

    // Gets the env var name, like MONGODB_URI.
    const key = trimmedLine.slice(0, equalsIndex);

    // Gets the env var value and removes optional wrapping quotes.
    const value = trimmedLine.slice(equalsIndex + 1).replace(/^["']|["']$/g, "");

    // Adds the env var only if it has not already been set elsewhere.
    process.env[key] ??= value;
  }
}

// Reads the MongoDB connection string after .env.local has been loaded.
const uri = process.env.MONGODB_URI;

// Stops the script early with a clear message if the connection string is missing.
if (!uri) {
  throw new Error("Missing MONGODB_URI in .env.local");
}

// Creates a MongoDB client using the Atlas connection string.
const client = new MongoClient(uri);

try {
  // Opens the connection to MongoDB Atlas.
  await client.connect();

  // Selects the database named builder-project.
  const db = client.db("builder-project");

  // Selects the collection named builders.
  const collection = db.collection("builders");

  // Take every builder in my array. For each one, create a MongoDB replace operation. 
  // Look for an existing listing with the same developer, name, and address. 
  // If it exists, replace it with the new builder data. If it doesn't exist, insert it. 
  // Send all of these operations to MongoDB at once and wait until they finish.
  const result = await collection.bulkWrite(
    builders.map((builder) => ({
      replaceOne: {
        // This filter decides whether a listing already exists.
        // Matching by these stable fields prevents duplicate records when you rerun the seed.
        filter: {
          developer: builder.developer,
          name: builder.name,
          address: builder.address,
        },
        // This is the full document that will be inserted or used to replace the old one.
        replacement: builder,

        // If no matching listing exists, MongoDB inserts it as a new document.
        //means update + insert
        upsert: true,
      },
    }))
  );

  // Prints a short summary so you know what happened.
  console.log(`Seeded ${builders.length} builder listings.`);
  console.log(`Inserted: ${result.upsertedCount}`);
  console.log(`Updated: ${result.modifiedCount}`);
} finally {
  // Closes the database connection whether the script succeeds or fails.
  await client.close();
}
