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
  imageUrl: string;
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

    // get the image from the Form data
    const image = formData.get("image");

    // image verification
    // checks if the image is actually a File type
    // also checks image size
    if (!(image instanceof File) || image.size === 0) {
      return;
    }

    // makes a temp browser URL for the selected image
    const imageUrl = URL.createObjectURL(image);

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

      imageUrl,
    });
  }

  // release the temp image URL when the preview closes
  useEffect(() => {
    // declare imageUrl with the url of the preview image
    // ?. will return undefined instead of throwing an error if imageUrl doesn't exist
    const imageUrl = preview?.imageUrl;

    // cleanup function, a function returned from useEffect is its cleanup function
    // react runs it before running effect again because the preview changed
    // or when the component is removed from the page
    return () => {
      // read the imageUrl
      // continue only if imageUrl is exists
      if (imageUrl) {
        // tells the browser that the temp URL is no longer needed
        // when this is called earlier: const imageUrl = URL.createObjectURL(image);
        // the browser keeps access to the underlying file data in memory
        // by calling revokeObjectURL() it releases that memory, but doesn't delete/remove anything
        URL.revokeObjectURL(imageUrl);
      }
    };
    // [preview?.imageUrl] tells React to rerun the effect whenever th URL changes
  }, [preview?.imageUrl]);

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
              {/* Temporary preview of the selected local image. */}
              <div className="relative h-64 w-full sm:h-96">
                <Image
                  src={preview.imageUrl}
                  alt={preview.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>

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
