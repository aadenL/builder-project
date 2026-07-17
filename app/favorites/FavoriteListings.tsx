"use client";

import Link from "next/link";
import BuilderCard from "@/app/BuilderCard";
import type { Builder } from "@/app/builderData";
import { useFavorites } from "@/app/context/favorites";

export default function FavoriteListings({ builders }: { builders: Builder[] }) {
  const { favorites, isLoaded } = useFavorites();
  const favoriteBuilders = builders.filter((builder) => favorites.includes(builder._id));

  if (!isLoaded) {
    return <p className="rounded-xl border border-border bg-surface p-6 text-muted">Loading saved favorites…</p>;
  }

  if (favoriteBuilders.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-muted">
        <p>You have not saved any listings yet.</p>
        <Link href="/" className="mt-3 inline-block font-semibold text-accent hover:underline">
          Browse listings
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {favoriteBuilders.map((builder) => (
        <BuilderCard key={builder._id} builder={builder} />
      ))}
    </div>
  );
}
