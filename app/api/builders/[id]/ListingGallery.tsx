"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

type ListingGalleryProps = {
  listingId: string;
  listingName: string;
  primaryImageUrl: string;
  imageCount: number;
  imageAlts: string[];
};

// this function will receive 4 params and a props object that will extract those 4 properties
export default function ListingGallery({
  listingId,
  listingName,
  primaryImageUrl,
  imageCount,
  imageAlts,
}: ListingGalleryProps) {
  // create a React state that tracks which image is currently being displayed
  // activeIndex is the current image array index and setActive index is the function for changing that index
  // useState(0) just measn display the first image initially
  const [activeIndex, setActiveIndex] = useState(0);

  // Start with a stable fallback, then replace it with the active image's real
  // width-to-height ratio as soon as that image finishes loading.
  const [activeAspectRatio, setActiveAspectRatio] = useState("4 / 3");

  function showPrevious() {
    // (current) => (current === 0 ? imageCount - 1 : current - 1) means:
    // if current === 0 then return imageCount - 1
    // for example, if imageCount = 5, then the last index is 5 - 1 = 4
    // therefore, pressing Previous on image 0 wraps to image 4
    // otherwise, current - 1 moves 1 position backwards
    setActiveIndex((current) => (current === 0 ? imageCount - 1 : current - 1));
  }

  function showNext() {
    // (current) => (current === imageCount - 1 ? 0 : current + 1) means:
    // if current === imageCount - 1 return 0, that wraps the gallery back to the first image if they are already on the final image in the gallery
    // otherwise, current + 1 moves one position forwards
    setActiveIndex((current) => (current === imageCount - 1 ? 0 : current + 1));
  }

  // New listings use MongoDB's indexed image route. Older listings without an
  // imageCount continue using the existing primary image URL stored in `img`.
  const hasStoredGallery = imageCount > 0;
  const displayedImageCount = hasStoredGallery ? imageCount : 1;

  function getImageUrl(index: number) {
    return hasStoredGallery
      ? `/api/builders/${listingId}/image?index=${index}`
      : primaryImageUrl;
  }

  // creates the URL for the currently active image
  const imageUrl = getImageUrl(activeIndex);

  // pulls the alt description for the active image
  // || means use the value of the left if it is truthy, otherwise use the value on the right
  const alt =
    imageAlts[activeIndex] || `${listingName} image ${activeIndex + 1}`;

  return (
    <section
      aria-label={`${listingName} image gallery`}
      className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div
        className="relative w-full bg-black transition-[aspect-ratio] duration-200"
        style={{ aspectRatio: activeAspectRatio }}
      >
        <Image
          key={imageUrl}
          src={imageUrl}
          alt={alt}
          fill
          unoptimized
          className="object-contain"
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;

            if (naturalWidth > 0 && naturalHeight > 0) {
              setActiveAspectRatio(`${naturalWidth} / ${naturalHeight}`);
            }
          }}
        />

        {displayedImageCount > 1 && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Show previous image"
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            >
              <ChevronLeft aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={showNext}
              aria-label="Show next image"
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </>
        )}

        <p className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white">
          {activeIndex + 1} / {displayedImageCount}
        </p>
      </div>

      {displayedImageCount > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3">
          {Array.from({ length: displayedImageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1}`}
              aria-current={activeIndex === index ? "true" : undefined}
              className={`relative h-20 w-28 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 ${
                activeIndex === index ? "border-accent" : "border-transparent"
              }`}
            >
              <Image
                src={getImageUrl(index)}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
