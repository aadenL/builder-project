import BuilderCard from "@/app/BuilderCard";
import { builders } from "@/app/builders";

export default function Home() {
  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-8">
        Preconstruction Listings
      </h1>

      <div className="grid gap-6">
        {builders.map((builder) => (
          <BuilderCard key={builder.id} builder={builder} />
        ))}
      </div>
    </main>
  );
}
