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

// These are the builder listings we want to insert into MongoDB.
// We do not include _id because MongoDB will automatically create real ObjectIds.
const builders = [
  {
    developer: "Fairgate Homes",
    name: "Upper Stouffville",
    location: "Whitchurch-Stouffville, Ontario",
    address: "Baker Hill Boulevard & West Lawn Crescent, L4A 7X3",
    type: "Single Family Home",
    conStatus: "Construction",
    ceilings: "8 feet",
    deposit:
      "Deposit Structure of $200,000: $40,000 with Offer, $40,000 in 30 days, $40,000 in 60 days, $40,000 in 90 days, $40,000 in 120 days",
    price: 2229990,
    beds: 4,
    baths: 4,
    garage: 2,
    sqft: 3553,
    desc: "Luxury detached home with spacious open-concept layout and premium finishes.",
    listStatus: "Selling",
    img: "https://prodlisting.livabl.com/imageSponsors/xlarge/2021_10_13_01_07_07_40_2c_p25_1920.webp",
    features: [
      "Double car garage",
      "Open concept kitchen",
      "Large primary bedroom",
      "Modern exterior",
      "Family-friendly community",
    ],
  },
  {
    developer: "Fieldgate Homes",
    name: "Cityside - Phase 3",
    location: "Whitchurch-Stouffville, Ontario",
    address: "York Durham Line & McKean Drive, L4A 0S1",
    type: "Single Family Home",
    conStatus: "Building",
    ceilings: "9+ feet",
    deposit: "none",
    price: 1499990,
    beds: 4,
    baths: 4,
    garage: 2,
    sqft: 3205,
    desc: "Luxury single-family homes featuring premium finishes, high-end construction details, and thoughtfully designed interior and exterior appointments throughout.",
    listStatus: "Selling",
    img: "https://prodlisting.livabl.com/imageSponsors/xlarge/2024_03_01_05_13_21_barkley-b.webp",
    features: [
      "Gas fireplace in family room",
      "Central air/ventilation rough-in with HRV system",
      "Hardwood flooring on main level",
      "Attached garage with insulated steel door",
    ],
  },
  {
    developer: "Fairgate Homes",
    name: "William St. Exhibit",
    location: "Whitchurch-Stouffville, Ontario",
    address: "Harold Avenue & William Street, L4A 1B6",
    type: "Single Family Home",
    conStatus: "Complete",
    ceilings: "unknown",
    deposit: "none",
    price: 2349000,
    beds: 4,
    baths: 6,
    garage: 2,
    sqft: 3414,
    desc: "An exclusive collection of luxury 50' single-family homes in Upper Stouffville, offering spacious family-focused living, premium craftsmanship, nearby nature destinations, and convenient access to GO Transit, Highway 404, Richmond Hill, Markham, and Toronto.",
    listStatus: "Selling",
    img: "https://prodlisting.livabl.com/imageSponsors/xlarge/2024_02_20_07_05_38_101.webp",
    features: [
      "Luxury 50' single-family homes",
      "Family-friendly neighbourhood",
      "Close to Bruce's Mill Conservation Area and local nature destinations",
      "Convenient access to GO Transit and Highway 404",
    ],
  },
];

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
