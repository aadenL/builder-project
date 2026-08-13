import Link from "next/link";

import { requireAdmin } from "@/app/admin/requireAdmin";
import { deleteListing } from "./actions";

export default async function adminListingsPage() {
  const { db } = await requireAdmin();

  const listings = await db
    .collection("builders")
    .find(
      {},
      {
        projection: {
          name: 1,
          developer: 1,
          location: 1,
          conStatus: 1,
          price: 1,
          img: 1,
          imageCount: 1,
        },
      },
    )
    .sort({
      _id: -1,
    })
    .toArray();

  return (
    <main className="flex-1 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              Admin
            </p>

            <h1 className="mt-2 text-3xl font-bold">Manage listings</h1>
          </div>

          <Link
            href="/admin/listings/new"
            className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-white"
          >
            Add a listing
          </Link>
        </div>

        <div className="mt-8 grid gap-4">
          {listings.map((listing) => {
            const listingId = listing._id.toString();

            // Bind the listing ID to the Server Action.
            const deleteListingWithId = deleteListing.bind(null, listingId);

            return (
              <article
                key={listingId}
                className="grid gap-4 rounded-xl border border-border bg-surface p-5 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <h2 className="text-lg font-bold">{listing.name}</h2>

                  <p className="mt-1 text-sm text-muted">
                    {listing.developer} · {listing.location}
                  </p>

                  <p className="mt-2 text-sm">
                    {listing.conStatus} · $
                    {Number(listing.price).toLocaleString()}
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    {listing.imageCount ?? 1} images
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
                  <Link
                    href={`/builders/${listingId}`}
                    className="rounded-lg border border-border px-3 py-2 text-center text-sm font-semibold sm:px-4"
                  >
                    View
                  </Link>

                  <Link
                    href={`/admin/listings/${listingId}/edit`}
                    className="rounded-lg border border-border px-3 py-2 text-center text-sm font-semibold sm:px-4"
                  >
                    Edit
                  </Link>

                  <form action={deleteListingWithId} className="contents sm:block">
                    <button
                      type="submit"
                      className="w-full cursor-pointer rounded-lg border border-red-500 px-3 py-2 text-sm font-semibold text-red-600 sm:px-4"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </article>
            );
          })}

          {listings.length === 0 && (
            <p className="rounded-xl border border-border p-6 text-muted">
              There are no listings yet.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
