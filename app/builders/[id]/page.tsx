import { notFound } from "next/navigation";
import { builders } from "@/app/builders";

export function generateStaticParams() {
  return builders.map((builder) => ({
    id: builder._id.toString(),
  }));
}

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const builder = builders.find((item) => item._id === id);

  if (!builder) return notFound();

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
