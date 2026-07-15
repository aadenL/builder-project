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
    <main className="p-10">
      <img
        src={builder.img}
        alt={builder.name}
        className="w-full max-h-[400px] object-cover rounded-lg mb-6"
      />

      <h1 className="text-3xl font-bold mb-2">
        {builder.name}
      </h1>

      <p className="text-xl mb-4">
        ${builder.price.toLocaleString()}
      </p>

      <p className="mb-4">
        {builder.desc}
      </p>

      <p className="mb-4">
        {builder.beds} Bed &bull; {builder.baths} Bath &bull; {builder.sqft} sqft
      </p>

      <h2 className="font-semibold mb-2">
        Features
      </h2>

      <ul className="list-disc pl-5">
        {builder.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </main>
  );
}
