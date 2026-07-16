import { notFound } from "next/navigation";
import { getBuilderById } from "@/app/builderData"; // Imports the function that fetches one builder from MongoDB by id.

// Tells Next.js this route should read from MongoDB at request time.
export const dynamic = "force-dynamic"; // Makes every builder detail page load fresh data from MongoDB.

export default async function BuilderPage({ // Marks the detail page as async so it can wait for route params and MongoDB.
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // In this Next.js version, route params are a Promise, so we await them first.
  const { id } = await params; // Pulls the MongoDB id out of the URL, like /builders/abc123.

  // Uses the MongoDB ObjectId from the URL to fetch one builder document.
  const builder = await getBuilderById(id); // Looks up the matching builder document in the database.

  // If the id is invalid or no document exists, show Next.js' 404 page.
  if (!builder) return notFound(); // Stops rendering and shows a 404 when no builder is found.

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <img
          src={builder.img}
          alt={builder.name}
          className="h-64 w-full object-cover sm:h-96"
        />

        <div className="p-5 sm:p-8">
          <p className="mb-2 text-sm font-semibold tracking-[0.14em] text-accent uppercase">Preconstruction home</p>
          <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {builder.name}
          </h1>

          <p className="mb-5 text-2xl font-semibold text-accent">
            ${builder.price.toLocaleString()}
          </p>

          <p className="mb-5 max-w-3xl leading-7 text-foreground/80">
            {builder.desc}
          </p>

          <p className="mb-7 rounded-xl bg-background px-4 py-3 text-sm font-medium text-muted sm:inline-block sm:text-base">
            {builder.beds} Bed &bull; {builder.baths} Bath &bull; {builder.sqft} sqft
          </p>

          <h2 className="mb-3 text-lg font-semibold">Features</h2>
          <ul className="grid gap-2 pl-5 text-muted marker:text-accent sm:grid-cols-2">
            {builder.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
