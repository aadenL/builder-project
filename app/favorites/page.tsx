import { getBuilders } from "@/app/builderData";
import FavoriteListings from "./FavoriteListings";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const builders = await getBuilders();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <p className="mb-2 text-sm font-semibold tracking-[0.14em] text-accent uppercase">
        Your saved homes
      </p>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Favorites
      </h1>
      <p className="mb-8 max-w-2xl text-base text-muted sm:text-lg">
        Keep the preconstruction listings you want to revisit in one place.
      </p>

      <FavoriteListings builders={builders} />
    </main>
  );
}
