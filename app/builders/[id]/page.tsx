import { notFound } from "next/navigation";
import { getBuilderById } from "@/app/builderData";
import ListingGallery from "@/app/api/builders/[id]/ListingGallery";
import CalBooking from "@/app/CalBooking";

export const dynamic = "force-dynamic";

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const builder = await getBuilderById(id);

  if (!builder) return notFound();

  const details = [
    ["Beds", builder.beds],
    ["Baths", builder.baths],
    ["Garage", builder.garage],
    ["Listing status", builder.listStatus],
    ["Construction status", builder.conStatus],
    ["Ceilings", builder.ceilings],
    ["Developer", builder.developer],
    ["Address", builder.address],
  ];

  return (
    <main className="pb-20">
      <section className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <p className="text-center text-xs font-semibold tracking-[0.18em] text-muted uppercase">
          {builder.location}
        </p>
        <h1 className="mt-2 break-words text-center text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {builder.name}
        </h1>

        <div className="mt-8">
          <ListingGallery
            listingId={builder._id}
            listingName={builder.name}
            primaryImageUrl={builder.img}
            imageCount={builder.imageCount ?? 0}
            imageAlts={builder.imageAlts ?? []}
          />
        </div>

        <div className="relative mt-6 overflow-hidden rounded-2xl bg-accent/10 px-4 py-6 sm:px-10 sm:py-10">
          <div className="absolute inset-y-0 left-0 hidden w-16 bg-[linear-gradient(135deg,transparent_49%,rgba(15,118,110,0.15)_50%,transparent_51%)] bg-[length:18px_18px] sm:block" />
          <div className="absolute inset-y-0 right-0 hidden w-16 bg-[linear-gradient(135deg,transparent_49%,rgba(15,118,110,0.15)_50%,transparent_51%)] bg-[length:18px_18px] sm:block" />

          <div className="relative mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 sm:gap-12">
            <div>
              <h2 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">
                Overview
              </h2>
              <p className="text-sm leading-6 text-foreground/80">
                {builder.desc}
              </p>
            </div>
            <div className="flex flex-col justify-end">
              <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
                Starting from
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                ${builder.price.toLocaleString()}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {builder.type} homes in {builder.location}, with plans up to{" "}
                {builder.sqft.toLocaleString()} square feet.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {builder.location} details
          </h2>
          <p className="mt-5 text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            The fine art of family living
          </p>
          <p className="mt-4 text-sm leading-7 text-foreground/80">
            {builder.desc}
          </p>

          {builder.features.length > 0 && (
            <>
              <h3 className="mt-8 text-sm font-semibold text-foreground">
                Highlights
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {builder.features.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-full bg-accent/10 px-3 py-1 text-sm text-foreground/80"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <dl className="self-start border-t border-border">
          {details.map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 border-b border-border py-3 text-sm sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-4"
            >
              <dt className="font-semibold text-foreground">{label}</dt>
              <dd className="break-words text-foreground/75">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-accent/10" />
        <div className="relative grid gap-5 rounded-xl border border-accent/30 bg-surface p-5 shadow-sm sm:grid-cols-3 sm:p-8">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Pricing and fees
            </h2>
            <p className="mt-4 text-sm font-semibold text-foreground">
              Available unit price
            </p>
            <p className="mt-1 text-sm text-muted">
              From ${builder.price.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Deposit</p>
            <p className="mt-1 text-sm text-muted">
              {builder.deposit || "Contact developer"}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Average price per sqft
            </p>
            <p className="mt-1 text-sm text-muted">
              ${Math.round(builder.price / builder.sqft).toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            Pre-Construction Consultation
          </p>

          <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            Schedule a Consultation
          </h2>
        </div>

        <CalBooking
          listingId={builder._id}
          listingName={builder.name}
          listingAddress={builder.address}
        />
      </section>
    </main>
  );
}
