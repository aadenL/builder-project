"use client";

import { useState } from "react";

import type { Builder } from "./builderData";
import BuilderCard from "./BuilderCard";
import ListingsMap from "./ListingsMap";

export default function ListingsExplorer({
  listings,
}: {
  listings: Builder[];
}) {
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);

  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null,
  );

  const activeListingId = hoveredListingId ?? selectedListingId;

  return (
    <div className="grid lg:min-h-0 lg:flex-1 lg:grid-cols-2">
      {/* Listing cards. */}
      <section className="order-2 px-4 py-6 sm:px-6 lg:order-1 lg:min-h-0 lg:overflow-y-auto lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
          {listings.map((listing) => (
            <BuilderCard
              key={listing._id}
              builder={listing}
              active={activeListingId === listing._id}
              onHover={setHoveredListingId}
              onSelect={setSelectedListingId}
            />
          ))}
        </div>
      </section>

      {/* Leaflet map. */}
      <aside className="order-1 h-72 min-h-0 sm:h-96 lg:order-2 lg:h-full">
        <ListingsMap
          listings={listings}
          activeListingId={activeListingId}
          selectedListingId={selectedListingId}
          onMarkerHover={setHoveredListingId}
          onMarkerSelect={setSelectedListingId}
        />
      </aside>
    </div>
  );
}
