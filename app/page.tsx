import BuilderCard from "@/app/BuilderCard";
import { getBuilders } from "@/app/builderData"; // Imports the function that reads builder listings from MongoDB.

// Tells Next.js to render this page on each request so it always reads fresh MongoDB data.
export const dynamic = "force-dynamic"; // Makes the homepage server-render dynamically instead of relying on a static build.

export default async function Home() { // Marks the page as async so it can wait for MongoDB before rendering.
  // Fetches all builder listings from the MongoDB "builders" collection.
  const builders = await getBuilders(); // Loads the builder documents and stores them in the builders array.

  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-8">
        Preconstruction Listings
      </h1>

      {builders.length > 0 ? ( // Checks whether MongoDB returned any builder listings.
        <div className="grid gap-6">
          {builders.map((builder) => (
            <BuilderCard key={builder._id} builder={builder} />
          ))}
        </div>
      ) : (
        // Shows a simple empty state if MongoDB has no listings yet.
        <p>No listings are available yet.</p> // Renders this message when the MongoDB collection is empty.
      )}
    </main>
  );
}
