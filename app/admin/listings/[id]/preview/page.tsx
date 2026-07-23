import { ObjectId } from "mongodb";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/app/auth/session";
import { getBuilderById } from "@/app/builderData";
import { getDb } from "@/app/mongodb";

// declaring a TypeScript type of what kind of params the preview page requires
type PreviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PreviewPag({ params }: PreviewPageProps) {
  const { id } = await params;
  const session = await getSession();

  // if the session doesn't exist or the userId is invalid, redirect to login page
  if (!session || !ObjectId.isValid(session.userId)) {
    redirect("/login");
  }

  // connect to database
  const db = await getDb();

  // turn userId back into an ObjectId, search for this id in the database
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(session.userId) },

    // return only if they are an admin
    { projection: { isAdmin: 1 } },
  );

  // if user is not an admin
  // ?. will return an undefined instead of throwing an error
  if (user?.isAdmin !== true) {
    // redirect to front page
    redirect("/");
  }

  // assign builder the data given by getBuilderById
  const builder = await getBuilderById(id);

  // if this builder info does not exist return
  if (!builder) {
    // shows a notFound error 404 page instead of rendering the new page
    notFound();
  }

  return (
    // main contains all of the visible content on the preview page
    <main className="flex-1 px-4 py-10 sm:px-6">
      {/* keeps the page content centered and prevents it from becoming too wide */}
      <div className="mx-auto max-w-5x1">
        {/* this is the preview screen */}
        <div className="mb-6 rounded-x1 border border-border border-accent bg-surface p-4">
          {/* identifies this page as a preview rather than the normal listing page */}
          <p className="font-semibold text-accent">Listing preview</p>

          {/* explains what the administrator is currently viewing */}
          <p className="mt-1 text-sm text-muted">
            Preview of your newly created listing
          </p>
        </div>

        {/* Showing image and basic information */}
        <section className="overflow-hidden rounded-2x1 border border-border bg-surface shadow-x1 shadow-slate-900/5">
          {/* displays the image URL saved with the new listing */}
          <img
            src={builder.img}
            alt={builder.name}
            className="h-80 w-full object-cover"
          />

          {/* adds spacing around all of the written listing information */}
          <div className="p-6 sm:p-8">
            {/* displays the current listing status */}
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">
              {builder.listStatus}
            </p>

            {/* displays the listing name as the main page heading */}
            <h1 className="mt-2 text-3x1 font-bold text-foreground">
              {builder.name}
            </h1>

            {/* displays the developer responsible for the project */}
            <p className="mt-1 text-l text-muted">By {builder.developer}</p>

            {/* formats the number as a readable starting price */}
            <p className="mt-4 text-2x1 font-bold text-foreground">
              Starting at ${builder.price.toLocaleString()}
            </p>

            {/* displays the full location of the development */}
            <p className="mt-2 text-muted">
              {builder.address}, {builder.location}
            </p>

            {/* Main property specifications */}
            <dl className="mt-6 grid gap-4 rounded-x1 border border-border p-4 sm:grid-cols-3">
              {/* groups the bedroom label and its value */}
              <div>
                {/* describes what the value below represents */}
                <dt className="text-sm text-muted">Bedrooms</dt>
                {/* displays the number of bedrooms */}
                <dd className="font-semibold">{builder.beds}</dd>
              </div>

              {/* groups the bathroom label and its value */}
              <div>
                {/* describes what the value below represents */}
                <dt className="text-sm text-muted">Bathrooms</dt>
                {/* displays the number of bathrooms */}
                <dd className="font-semibold">{builder.baths}</dd>
              </div>

              {/* groups the square-footage label and its value */}
              <div>
                {/* describes what the value below represents */}
                <dt className="text-sm text-muted">Square feet</dt>
                {/* displays square footage with number formatting */}
                <dd className="font-semibold">
                  {builder.sqft.toLocaleString()}
                </dd>
              </div>
            </dl>

            {/* displays the full listing description */}
            <p className="mt-6 leading-7 text-foreground">{builder.desc}</p>

            {/* selected features */}
            {builder.features.length > 0 && (
              // only show this section when at least one feature was selected
              <div className="mt-6">
                {/* heading for the selected features */}
                <h2 className="font-bold">Features</h2>

                {/* allows feature labels to wrap onto additional lines */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {/* creates one visual label for every feature */}
                  {builder.features.map((feature) => (
                    // feature is used as the key because each selected feature is unique
                    <span
                      key={feature}
                      className="rounded-full border border-border px-3 py-1 text-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* actions available after reviewing the preview */}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {/* returns the administrator to the form to create another listing */}
          <Link
            href="/admin/listing/new"
            className="rounded-lg border border-border px-5 py-2.5 font-semibold"
          >
            Add another listing
          </Link>

          {/* opens the newly created listing on its normal public page */}
          <Link
            href={`/builders/${builder._id}`}
            className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-white"
          >
            View live listing
          </Link>
        </div>
      </div>
    </main>
  );
}
