import Link from "next/link";
import type { Builder } from "@/app/builderData";

export default function BuilderCard({ builder }: { builder: Builder }) {
  return (
    <Link href={`/builders/${builder._id}`} className="block">
      <div className="flex justify-between gap-6 border rounded-xl p-6 shadow-sm cursor-pointer">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold mb-2">
            {builder.name}
          </h2>

          <p className="text-xl mb-2">
            ${builder.price.toLocaleString()}
          </p>

          <p className="mb-4">
            {builder.beds} Bed &bull; {builder.baths} Bath &bull; {builder.sqft} sqft
          </p>

          <p className="mb-4">
            {builder.desc}
          </p>

          <ul className="list-disc pl-5">
            {builder.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>

        <div className="w-[300px] h-[200px] flex-shrink-0">
          <img
            src={builder.img}
            alt={builder.name}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      </div>
    </Link>
  );
}
