import type { ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";

import { requireAdmin } from "@/app/admin/requireAdmin";
import { updateListing } from "@/app/admin/listings/actions";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db } = await requireAdmin();

  if (!ObjectId.isValid(id)) {
    notFound();
  }

  const listing = await db.collection("builders").findOne(
    {
      _id: new ObjectId(id),
    },
    {
      projection: {
        "images.data": 0,
        "floorplanImages.data": 0,
      },
    },
  );

  if (!listing) {
    notFound();
  }

  //
  const updateListingWithId = updateListing.bind(null, id);

  const features = Array.isArray(listing.features)
    ? listing.features.map(String)
    : [];

  const tags = Array.isArray(listing.tags) ? listing.tags.map(String) : [];

  const imageAlts = Array.isArray(listing.imageAlts)
    ? listing.imageAlts.map(String)
    : [];

  const imageCount =
    typeof listing.imageCount === "number"
      ? listing.imageCount
      : listing.img
        ? 1
        : 0;

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:py-14">
      <div className="mx-auto w-full max-w-5xl">
        {/* Navigation back to the admin dashboard. */}
        <Link
          href="/admin/listings"
          className="text-sm font-semibold text-accent transition hover:opacity-75"
        >
          ← Back to listings
        </Link>

        {/* Page heading. */}
        <header className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Admin
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Edit listing
          </h1>

          <p className="mt-3 max-w-2xl text-muted">
            Update the information for {String(listing.name)}.
          </p>
        </header>

        {/* Submitting this form calls updateListing(). */}
        <form action={updateListingWithId} className="mt-8 space-y-6">
          {/* Basic development information. */}
          <FormSection
            title="Development details"
            description="Update the project's name, developer, property type, and construction status."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <EditInput
                name="name"
                label="Listing name"
                defaultValue={String(listing.name ?? "")}
              />

              <EditInput
                name="developer"
                label="Developer"
                defaultValue={String(listing.developer ?? "")}
              />

              <EditInput
                name="type"
                label="Property type"
                defaultValue={String(listing.type ?? "")}
              />

              {/* Restrict construction status to supported values. */}
              <label className="grid gap-2 text-sm font-semibold text-foreground">
                <span>
                  Construction status <RequiredMark />
                </span>

                <select
                  name="conStatus"
                  required
                  defaultValue={String(listing.conStatus ?? "")}
                  className="cursor-pointer rounded-lg border border-border bg-background px-3 py-2.5 font-normal text-foreground"
                >
                  <option value="Pre-construction">Pre-construction</option>

                  <option value="Under construction">Under construction</option>

                  <option value="Completed">Completed</option>
                </select>
              </label>
            </div>

            {/* Keep the existing verified address for the first edit version. */}
            <div className="mt-5 grid gap-2">
              <label
                htmlFor="current-address"
                className="text-sm font-semibold text-foreground"
              >
                Verified address
              </label>

              <input
                id="current-address"
                value={String(listing.address ?? "")}
                readOnly
                className="cursor-not-allowed rounded-lg border border-border bg-background/60 px-3 py-2.5 text-muted"
              />

              {/* Submit the existing address values to the update action. */}
              <input
                type="hidden"
                name="address"
                value={String(listing.address ?? "")}
              />

              <input
                type="hidden"
                name="location"
                value={String(listing.location ?? "")}
              />

              <p className="text-xs text-muted">
                Address changes should use Geoapify autocomplete so the saved
                map coordinates remain accurate.
              </p>
            </div>
          </FormSection>

          {/* Pricing and unit specifications. */}
          <FormSection
            title="Pricing and specifications"
            description="Update pricing, dimensions, and typical unit information."
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <EditInput
                name="price"
                label="Starting price"
                type="number"
                defaultValue={Number(listing.price ?? 0)}
              />

              <EditInput
                name="sqft"
                label="Square feet"
                type="number"
                defaultValue={Number(listing.sqft ?? 0)}
              />

              <EditInput
                name="beds"
                label="Bedrooms"
                type="number"
                defaultValue={Number(listing.beds ?? 0)}
              />

              <EditInput
                name="baths"
                label="Bathrooms"
                type="number"
                defaultValue={Number(listing.baths ?? 0)}
              />

              <EditInput
                name="garage"
                label="Garage spaces"
                type="number"
                defaultValue={Number(listing.garage ?? 0)}
              />

              <EditInput
                name="ceilings"
                label="Ceiling height"
                defaultValue={String(listing.ceilings ?? "")}
              />
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <EditInput
                name="deposit"
                label="Deposit structure"
                defaultValue={String(listing.deposit ?? "")}
              />

              <EditInput
                name="listStatus"
                label="Listing status"
                defaultValue={String(listing.listStatus ?? "")}
              />
            </div>
          </FormSection>

          {/* Listing description, features, and tags. */}
          <FormSection
            title="Listing content"
            description="Update the description and searchable listing information."
          >
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              <span>
                Description <RequiredMark />
              </span>

              <textarea
                name="desc"
                required
                rows={8}
                defaultValue={String(listing.desc ?? "")}
                className="resize-y rounded-lg border border-border bg-background px-3 py-2.5 font-normal text-foreground"
              />
            </label>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {/* The update action will split this at each comma. */}
              <label className="grid gap-2 text-sm font-semibold text-foreground">
                <span>Features</span>

                <input
                  name="features"
                  defaultValue={features.join(", ")}
                  placeholder="Pool, Gym, Concierge"
                  className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal text-foreground"
                />

                <span className="text-xs font-normal text-muted">
                  Separate features using commas.
                </span>
              </label>

              {/* The update action will split this at each comma. */}
              <label className="grid gap-2 text-sm font-semibold text-foreground">
                <span>Tags</span>

                <input
                  name="tags"
                  defaultValue={tags.join(", ")}
                  placeholder="Townhomes, Quick move-in"
                  className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal text-foreground"
                />

                <span className="text-xs font-normal text-muted">
                  Separate tags using commas.
                </span>
              </label>
            </div>
          </FormSection>

          {/* Display existing images without loading their MongoDB binary data. */}
          <FormSection
            title="Current images"
            description="These images will remain attached to the listing."
          >
            {imageCount > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from(
                  {
                    length: imageCount,
                  },
                  (_, index) => (
                    <article
                      key={index}
                      className="overflow-hidden rounded-xl border border-border bg-background"
                    >
                      <div className="relative h-44">
                        <Image
                          src={`/api/builders/${id}/image?index=${index}`}
                          alt={
                            imageAlts[index] ||
                            `${String(listing.name)} image ${index + 1}`
                          }
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 100vw, 33vw"
                          className="object-cover"
                        />

                        {index === 0 && (
                          <span className="absolute top-2 left-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                            Primary image
                          </span>
                        )}
                      </div>

                      <div className="p-3">
                        <p className="text-sm text-muted">
                          {imageAlts[index] || `Image ${index + 1}`}
                        </p>
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">
                This listing does not have any images.
              </p>
            )}

            <p className="mt-4 text-sm text-muted">
              Image removal, replacement, and reordering can be added after
              basic listing editing is working.
            </p>
          </FormSection>

          {/* Form controls. */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin/listings"
              className="rounded-lg border border-border px-6 py-3 text-center font-semibold"
            >
              Cancel
            </Link>

            <Link
              href={`/builders/${id}`}
              className="rounded-lg border border-border px-6 py-3 text-center font-semibold"
            >
              View listing
            </Link>

            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-accent px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
      <div className="mb-6 border-b border-border pb-5">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>

        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>

      {children}
    </section>
  );
}

// Properties accepted by the reusable edit input.
type EditInputProps = {
  name: string;
  label: string;
  defaultValue: string | number;
  type?: "text" | "number";
  required?: boolean;
};

// Reusable input with the listing's current value.
function EditInput({
  name,
  label,
  defaultValue,
  type = "text",
  required = true,
}: EditInputProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-foreground">
      <span>
        {label} {required && <RequiredMark />}
      </span>

      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "any" : undefined}
        className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal text-foreground"
      />
    </label>
  );
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-accent">
      *
    </span>
  );
}
