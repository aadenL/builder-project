"use client";

import Link from "next/link";
import Image from "next/image";
import type { Builder } from "@/app/builderData";
import { Heart } from "lucide-react";
import { useFavorites } from "./context/favorites";

type BuilderCardProps = {
  builder: Builder;
  active?: boolean;
  onHover?: (listingId: string | null) => void;
  onSelect?: (listingId: string) => void;
};

export default function BuilderCard({
  builder,
  active = false,
  onHover,
  onSelect,
}: BuilderCardProps) {
  //
  const { toggleFavorite, isFavorite } = useFavorites();

  // checking if builder._id is already in favorites array
  const favorite = isFavorite(builder._id);

  // e is short for event, the event in this case is a mouse event, meaning the information recieved will be any kind of mouse activity
  function favButton(e: React.MouseEvent) {
    // preventDefault stops the browser's default behaviour, in this case prevents the link from being clicked
    e.preventDefault();
    // stopPropogation stops the event from bubbling upward, meaning instead of the button being clicked and the button handler running then the link handler running
    // then it navigates away to the link, it just stops after the button handler runs so you favorite the listing instead of clicking on the link
    e.stopPropagation();

    toggleFavorite(builder._id);
  }

  return (
    <div
      className="group relative rounded-2xl"
      onMouseEnter={() => onHover?.(builder._id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <button
        onClick={favButton}
        className="absolute right-3 top-3 z-10 cursor-pointer"
        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={favorite}
      >
        <Heart
          size={32}
          fill={favorite ? "currentColor" : "none"}
          className={favorite ? "text-red-600" : "text-foreground"}
        />
      </button>

      <Link
        href={`/builders/${builder._id}`}
        onClick={() => onSelect?.(builder._id)}
        onFocus={() => onHover?.(builder._id)}
        onBlur={() => onHover?.(null)}
        className="group block rounded-2xl focus-visible:outline-none"
      >
        <article
          className={`relative flex h-full flex-col overflow-hidden rounded-xl border bg-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md ${
            active ? "border-accent ring-2 ring-accent/20" : "border-border"
          }`}
        >
          <div className="relative h-40 w-full shrink-0">
            <Image
              src={builder.img}
              alt={builder.name}
              fill
              sizes="(min-width: 1280px) 17vw, (min-width: 640px) 25vw, 100vw"
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
              {builder.beds} Bed &bull; {builder.baths} Bath &bull;{" "}
              {builder.sqft} sqft
            </p>

            <p className="line-clamp-2 text-sm leading-6 text-foreground/80">
              {builder.desc}
            </p>

            <p className="mt-3 text-sm font-medium text-accent">
              View listing <span aria-hidden="true">→</span>
            </p>
          </div>
        </article>
      </Link>
    </div>
  );
}
