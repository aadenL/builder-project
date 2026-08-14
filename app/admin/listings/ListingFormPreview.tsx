"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type SubmitEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { useFormStatus } from "react-dom";
import { createListing } from "./actions";

// declaring the type of data that will be accepted
type PreviewData = {
  name: string;
  developer: string;
  location: string;
  address: string;
  type: string;
  conStatus: string;
  price: number;
  beds: number;
  baths: number;
  garage: number;
  sqft: number;
  desc: string;
  listStatus: string;
  features: string[];
  tags: string[];
  // changed so it is able to accept multiple images
  images: {
    previewUrl: string;
    alt: string;
    fileName: string;
  }[];
  floorplanImage: {
    previewUrl: string;
    alt: string;
  } | null;
};

export default function ListingFormPreview({
  children,
}: {
  children: ReactNode;
}) {
  // Holds the info displayed on the preview screen
  // preview holds the info, setPreview is the change variable
  const [preview, setPreview] = useState<PreviewData | null>(null);

  // Tracks whether the current submission is the final submission
  const finishing = useRef(false);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    // Allow the server action only after Finish button is clicked
    if (finishing.current) {
      return;
    }

    // Prevent the form from reaching MongoDB because it's a preview
    event.preventDefault();

    // pulls the Form info from the current event
    const formData = new FormData(event.currentTarget);

    // Read all entries first so malformed or empty values are rejected instead
    // of silently being removed from the preview.
    const imageEntries = formData.getAll("images");

    // checking if they didnt submit any images
    // also rejecting submission when no images were submitted, any entry is not a File, or any file is empty
    if (
      imageEntries.length === 0 ||
      !imageEntries.every(
        (entry): entry is File => entry instanceof File && entry.size > 0,
      )
    ) {
      throw new Error("Please select valid, non-empty images");
    }

    // images will only contain valid, non-empty files now
    const images = imageEntries;

    // image verification
    // making sure they dont exceed the limit of 5 pictures
    if (images.length > 5) {
      throw new Error("You may only upload up to 5 images");
    }

    // define the allowed file types for images
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

    // define the single image max size
    const maxImageSize = 5 * 1024 * 1024;

    for (const image of images) {
      // if there is any image in the set of images submitted that is not of the allowed file types
      if (!allowedTypes.has(image.type)) {
        throw new Error(`${image.name} must be a JPG, PNG, or WebP`);
      }

      // if any image submitted exceeds the 5 MB size limit
      if (image.size > maxImageSize) {
        throw new Error(`${image.name} cannot be larger than 5 MB`);
      }
    }

    // Alt inputs and files are rendered in the same order by ImageUpload.
    // .getAll("imageAlt") retrieves all the alt descriptions in order
    // String() makes sure they are strings and trim() removes surrounding spaces
    const imageAlts = formData
      .getAll("imageAlt")
      .map((value) => String(value).trim());

    // Create one temporary browser URL and preview record for every image.
    // match the alt text with the correct image
    // map() converts every File into a preview record
    // previewUrl: URL.createObjectURL(image) creates a browser URL for the local file
    // alt: imageAlts[index] ?? "" matches the alt text to the image using their matching indexes
    // if an alt value is missing, it uses an empty string
    // fileName: image.name stores the OG filename for possible display/debugging
    const previewImages = images.map((image, index) => ({
      previewUrl: URL.createObjectURL(image),
      alt: imageAlts[index] ?? "",
      fileName: image.name,
    }));

    const floorplanEntry = formData.get("floorplanImage");
    const floorplanImage =
      floorplanEntry instanceof File && floorplanEntry.size > 0
        ? {
            previewUrl: URL.createObjectURL(floorplanEntry),
            alt: String(formData.get("floorplanImageAlt") ?? "").trim(),
          }
        : null;

    // accepts the name of the form field
    // used for fields that have string inputs
    // for example: name = "developer", and the value is Fairgate Homes"
    const text = (name: string) => String(formData.get(name) ?? "");

    // same thing as the top function but it's for number inputs instead
    // for example: name="price" but the value is a number like "980000"
    const number = (name: string) => Number(formData.get(name) ?? 0);

    setPreview({
      name: text("name"),
      developer: text("developer"),
      location: text("location"),
      address: text("address"),
      type: text("type"),
      conStatus: text("conStatus"),
      price: number("price"),
      beds: number("beds"),
      baths: number("baths"),
      garage: number("garage"),
      sqft: number("sqft"),
      desc: text("desc"),
      listStatus: text("listStatus"),

      features: formData.getAll("features").map(String),

      tags: formData.getAll("tags").map(String),

      // store all the preview images in state
      images: previewImages,
      floorplanImage,
    });
  }

  // Release every temporary image URL when this preview changes or closes.
  useEffect(() => {
    // cleanup for all URLs, if no preview exists it will use an empty array
    // the cleanup loops over the whole thing.
    // React runs this cleanup when the preview changes, the user closes the preview, or the compo
    const previewUrls = preview?.images.map((image) => image.previewUrl) ?? [];

    if (preview?.floorplanImage) {
      previewUrls.push(preview.floorplanImage.previewUrl);
    }

    // cleanup function, a function returned from useEffect is its cleanup function
    // react runs it before running effect again because the preview changed
    // or when the component is removed from the page
    return () => {
      previewUrls.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, [preview]);

  return (
    <form
      action={createListing}
      onSubmit={handleSubmit}
      className="mt-8 space-y-6"
    >
      {/* existing form sections appear here */}
      {children}

      {/* initial form actions */}
      {!preview && (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/account"
            className="rounded-lg border border-border px-6 py-3 text-center font-semibold"
          >
            Cancel
          </Link>

          {/* submitting through the normal button opens the preview */}
          <button
            type="submit"
            className="rounded-lg bg-accent px-6 py-3 font-semibold text-white cursor-pointer disabled:cursor-not-allowed"
          >
            Preview Listing
          </button>
        </div>
      )}

      {/* show full-screen preview before pushing to database */}
      {preview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-5xl">
            {/* Preview notice */}
            <div className="mb-6 rounded-xl border border-accent bg-surface p-4">
              <p className="font-semibold text-accent">Listing preview</p>

              <p className="mt-1 text-sm text-muted">
                Review this listing before publishing
              </p>
            </div>

            {/* Listing preview. */}
            <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
              {/* The first image is primary and receives the large preview. */}
              {preview.images[0] && (
                <div className="relative h-64 w-full sm:h-96">
                  <Image
                    src={preview.images[0].previewUrl}
                    alt={preview.images[0].alt || preview.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}

              {/* Show the complete ordered gallery below the primary image. */}
              {preview.images.length > 1 && (
                <div className="grid grid-cols-2 gap-2 border-b border-border bg-background p-2 sm:grid-cols-4">
                  {preview.images.map((image, index) => (
                    <div
                      key={image.previewUrl}
                      className="relative h-28 overflow-hidden rounded-lg"
                    >
                      <Image
                        src={image.previewUrl}
                        alt={image.alt || `${preview.name} image ${index + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      {index === 0 && (
                        <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-1 text-xs font-semibold text-white">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="p-6 sm:p-8">
                {/* Listing status. */}
                <p className="text-sm font-semibold uppercase tracking-wide text-accent">
                  {preview.listStatus}
                </p>

                {/* Listing name and developer. */}
                <h1 className="mt-2 text-3xl font-bold">{preview.name}</h1>

                <p className="mt-1 text-muted">By {preview.developer}</p>

                {/* Price and location. */}
                <p className="mt-5 text-2xl font-bold">
                  Starting at ${preview.price.toLocaleString()}
                </p>

                <p className="mt-2 text-muted">
                  {preview.address}, {preview.location}
                </p>

                {/* Property specifications. */}
                <dl className="mt-6 grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-4">
                  <div>
                    <dt className="text-sm text-muted">Bedrooms</dt>
                    <dd className="font-semibold">{preview.beds}</dd>
                  </div>

                  <div>
                    <dt className="text-sm text-muted">Bathrooms</dt>
                    <dd className="font-semibold">{preview.baths}</dd>
                  </div>

                  <div>
                    <dt className="text-sm text-muted">Garage</dt>
                    <dd className="font-semibold">{preview.garage}</dd>
                  </div>

                  <div>
                    <dt className="text-sm text-muted">Square feet</dt>
                    <dd className="font-semibold">
                      {preview.sqft.toLocaleString()}
                    </dd>
                  </div>
                </dl>

                {/* Description. */}
                <p className="mt-6 leading-7">{preview.desc}</p>

                {preview.floorplanImage && (
                  <section className="mt-10 border-t border-border pt-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
                      Project layout
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">
                      Floor plan &amp; site plan
                    </h2>
                    <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-xl border border-border bg-background">
                      <Image
                        src={preview.floorplanImage.previewUrl}
                        alt={
                          preview.floorplanImage.alt ||
                          `Floor or site plan for ${preview.name}`
                        }
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                  </section>
                )}

                {/* Selected features. */}
                {preview.features.length > 0 && (
                  <div className="mt-6">
                    <h2 className="font-bold">Features</h2>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {preview.features.map((feature) => (
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

                {/* Selected tags. */}
                {preview.tags.length > 0 && (
                  <div className="mt-6">
                    <h2 className="font-bold">Tags</h2>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {preview.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-accent/10 px-3 py-1 text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>

            {/* Preview actions. */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-lg border border-border px-6 py-3 font-semibold cursor-pointer disabled:cursor-not-allowed"
              >
                Return to edit
              </button>

              <FinishButton
                onFinish={() => {
                  // The next form submission may reach createListing().
                  finishing.current = true;
                }}
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

// define a function named FinishButton
function FinishButton({
  // receives an onFinish prop
  onFinish,
}: {
  // means onFinish must be a functin that accepts no args and returns nothing
  onFinish: () => void;
}) {
  // useFormStatus() reads the status of the parent form
  // pending is a boolean, false if form is not being submitted true if it's currently processing
  // must be rendered inside the form whose status it should track
  /** for example:
      <form action={createListing}>
        <FinishButton onFinish={handleFinish} />
      </form>
  */
  const { pending } = useFormStatus();

  // submit button
  return (
    <button
      // makes this button submit the surrounding form
      // when clicked, the onClick function runs:
      // the form submits and the form's action runs, then pending becomes true during submission
      type="submit"

      // runs the supplied onFinish function when clicked, strictly a click handler
      // this does no kind of verification
      onClick={onFinish}

      // disables the button while submission is in process
      disabled={pending}

      // styling the button
      className="rounded-lg bg-accent px-6 py-3 font-semibold text-white disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
    >
      {/* conditional label:
            if pending is true, buttonText = "Publishing..."
            else if pending is false, buttonText = "Finish and publish"
      */}
      {pending ? "Publishing..." : "Finish and publish"}
    </button>
  );
}
