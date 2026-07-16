"use client";

import Link from "next/link";
import type { Builder } from "@/app/builderData";
import { useState } from "react";
import { Heart } from "lucide-react";

export default function BuilderCard({ builder }: { builder: Builder }) {
  const [isFavorite, setIsFavorite] = useState(false);

  // e is short for event, the event in this case is a mouse event, meaning the information recieved will be any kind of mouse activity
  function favButton(e: React.MouseEvent) {
    // preventDefault stops the browser's default behaviour, in this case prevents the link from being clicked
    e.preventDefault();
    // stopPropogation stops the event from bubbling upward, meaning instead of the button being clicked and the button handler running then the link handler running
    // then it navigates away to the link, it just stops after the button handler runs so you favorite the listing instead of clicking on the link
    e.stopPropagation();

    setIsFavorite((prev) => !prev);
  }

  return (
    <div className="group relative rounded-2x1">
      <button onClick={favButton}
        className="absolute right-3 top-3 z-10 text-2x1 cursor-pointer" aria-label="Add to favorites"
      >
        <Heart
          size={32}
          fill={isFavorite ? "red" : "none"}
        />
      </button>
      
      <Link
        href={`/builders/${builder._id}`}
        className="group block rounded-2xl focus-visible:outline-none"
      >
        <article className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md">

          <div className="h-40 w-full shrink-0">
            <img
              src={builder.img}
              alt={builder.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-1 flex-col p-4">
            <h2 className="mb-1 line-clamp-1 text-lg font-semibold tracking-tight text-foreground group-hover:text-accent">
              {builder.name}
            </h2>

            <p className="mb-2 text-base font-semibold text-accent">
              ${builder.price.toLocaleString()}
            </p>

            <p className="mb-3 text-sm font-medium text-muted">
              {builder.beds} Bed &bull; {builder.baths} Bath &bull; {builder.sqft} sqft
            </p>

            <p className="line-clamp-2 text-sm leading-6 text-foreground/80">
              {builder.desc}
            </p>

            <p className="mt-3 text-sm font-medium text-accent">View listing <span aria-hidden="true">→</span></p>
          </div>
        </article>
      </Link>
    </div>
  );
}