"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";

export default function FloorplanImageUpload() {
  const [previewUrl, setPreviewUrl] = useState("");

  // function runs when the file input changes, i.e: when the user uploads an image
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    // pull the first file
    // event.target is the file input, .files is the input's file list, ?. prevents an error if there are no files
    // [0] retrieves the first file from the FileList
    const file = event.target.files?.[0];

    // updates the preview state using its current value
    setPreviewUrl((currentUrl) => {
      // if an older preview exists, remove the temp URL before creating a new one
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      // if the file exists, create and store a temp preview URL
      // otherwise if the file does not exist, store an empty string
      return file ? URL.createObjectURL(file) : "";
    });
  }

  // cleanup effect that runs before the effect runs again after previewUrl changes
  // or when this component is removed from the page
  /** TLDR:
   * Whenever the preview changes, release the old temp URL. Also release the current URL when the
   * upload component is removed from the page
   */
  useEffect(() => {
    return () => {
      // if previewUrl has a previously existing preview URL
      if (previewUrl) {
        // tells the browser that this temp URL is no longer needed
        // remove the browser resources associated with this preview
        // does not delete the user's original image
        URL.revokeObjectURL(previewUrl);
      }
    };
    // rerun the effect whenever the preview URL changes
    // react cleans up the previous URL before preparing cleanup for the new URL
  }, [previewUrl]);

  return (
    <div className="grid gap-4">
      <label className="relative flex cursor-pointer flex-col items-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-background px-6 py-10 text-center transition hover:border-accent">
        <input
          name="floorplanImage"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
        />

        <span className="font-semibold text-foreground">
          Upload floor/site plan
        </span>
        <span className="mt-1 text-sm text-muted">or click to select a file</span>
        <span className="mt-3 text-xs text-muted">
          One JPG, PNG, or WebP image—maximum 5 MB
        </span>
      </label>

      {previewUrl && (
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
          <Image
            src={previewUrl}
            alt="Selected floor plan preview"
            fill
            unoptimized
            className="object-contain"
          />
        </div>
      )}

      <label className="grid gap-2 text-sm font-semibold">
        Map description
        <input
          name="floorplanImageAlt"
          placeholder="Site plan showing building layout"
          className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal text-foreground placeholder:text-muted/70"
        />
      </label>
    </div>
  );
}
