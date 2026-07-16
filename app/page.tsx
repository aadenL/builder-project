import BuilderCard from "@/app/BuilderCard";
import { getBuilders } from "@/app/builderData"; // Imports the function that reads builder listings from MongoDB.

// Tells Next.js to render this page on each request so it always reads fresh MongoDB data.
export const dynamic = "force-dynamic"; // Makes the homepage server-render dynamically instead of relying on a static build.

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ query?: string | string[] }>;
}) { // Marks the page as async so it can wait for MongoDB before rendering.
  const query = (await searchParams).query;
  const searchQuery = typeof query === "string" ? query.trim() : "";
  // Fetches matching builder listings from the MongoDB "builders" collection.
  const builders = await getBuilders(searchQuery); // Loads the matching builder documents and stores them in the builders array.

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <p className="mb-2 text-sm font-semibold tracking-[0.14em] text-accent uppercase">
        Find your next home
      </p>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Preconstruction Listings
      </h1>
      <p className="mb-8 max-w-2xl text-base text-muted sm:text-lg">
        Browse upcoming homes and compare the details that matter most.
      </p>

      {searchQuery && (
        <p className="mb-5 text-sm text-muted">
          {builders.length} result{builders.length === 1 ? "" : "s"} for <span className="font-semibold text-foreground">&ldquo;{searchQuery}&rdquo;</span>
        </p>
      )}

      {builders.length > 0 ? ( // Checks whether MongoDB returned any builder listings.
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {builders.map((builder) => (
            <BuilderCard key={builder._id} builder={builder} />
          ))}
        </div>
      ) : (
        // Shows a helpful empty state when there are no listings or no matching results.
        <p className="rounded-xl border border-border bg-surface p-6 text-muted">
          {searchQuery ? "No listings match your search." : "No listings are available yet."}
        </p>
      )}
    </main>
  );
}
