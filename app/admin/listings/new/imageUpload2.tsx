// Client component
// required because it uses browser only features such as file inputs and drag-and-drop events
"use client";

// Import Next.js's optimized image component
import Image from "next/image";

import {
  // describes an input change event
  // would run when the user selects files using an input
  type ChangeEvent,

  // describes a drag-and-drop event, it is a type-only import
  type DragEvent,

  // runs code after rendering
  // for image upload, it is commonly used to clean up temporary URLs
  // cleanup is needed because URLs made with URL.createObjectURL() keeps the file data
  // available in browser memory
  useEffect,

  // keeps a reference to an actual DOM element, such as the file input
  useRef,

  // stores changing component data
  useState,
} from "react";

// describes an image selected by the user
type UploadItem = {
  // unique identifier to distinguish images
  id: string;
  // stores the actual browser File object
  // this is the file that will eventually be uploaded
  file: File;
  // stores a temp browser URL created from the file
  previewUrl: string;
  // alt descriptor
  alt: string;
};

// defining the max number of images the user may select
const MAX_IMAGES = 5;

// defining the max image size of one image in bytes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// creating a Set object to define the permitted file types
// a Set is used because:
// it expresses that these are unique allowed values, .has() means membership checking, and dupe entries are ignored
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// create and export the image upload component
export default function ImageUpload() {
  // creates a ref intended to point to the real file input
  // before rendering inputRef.current === null
  const inputRef = useRef<HTMLInputElement>(null);

  // creates a ref whose value is a Set of strings
  // the strings will be temp browser URLs
  const previewUrls = useRef(new Set<string>());

  // creates React state for the selected images
  // items is the current uploaded items, and setItems updates them
  // UploadItem[] means every array entry must match UploadItem
  // and ([]) means start with no selected items
  const [items, setItems] = useState<UploadItem[]>([]);

  // stores a validation or upload error message
  // initially error === ""
  const [error, setError] = useState("");

  // cleanup work for the component
  useEffect(() => {
    // copies the current Set into a local variable
    const urls = previewUrls.current;

    // React runs this returned function when the component is removed from the page
    return () => {
      // revoke every URL, it loops through every tracked preview URL and releases it
      // URL.revokeObjectURL(url) tells the browser that the temp URL is no longer needed
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
    // }, []) tells React to register this effect once when the component is mounted
    // cleanup runs when the component unmounts
    // does not rerun whenever items or the Set's contents change
    // mounted components actively exist on the page and have been rendered
    // unmounted components have been removed and are not on the page
  }, []);

  // defines a function that receives the complete updated list of image
  function updateInputFiles(nextItems: UploadItem[]) {
    // creates a browser-managed DataTransfer object
    // the file input's files property needs a FileList, normal arrays dont work
    // DataTransfer constructs the required FileList
    const transfer = new DataTransfer();

    // add each file, this runs once per uploaded item
    nextItems.forEach((item) => {
      // adds the items actual File to the DataTransfer
      transfer.items.add(item.file);
    });

    // checks that the file input is currently mounted and connected to the ref
    // a ref in simple terms is a persistent object that points to a value or DOM element through its .current property
    if (inputRef.current) {
      // replaces the files inside the actual <input type="file">
      // matters because changing React state alone doesn't update the browser's file input
      // inputRef.current.files before this assignment contains whatever files were previously in the file input
      // after this, it contains a newly rebuilt file list from nextItems
      inputRef.current.files = transfer.files;
    }

    // store the updated UploadItem[] in React state
    // causes the component to re-render so that the interface displays exactly the items in nextItems
    setItems(nextItems);

    // Both updates are necessary because there are two separate sources of information:
    //
    // inputRef.current.files → the FileList the browser submits with the form
    // items                  → the UploadItem[] React uses to render the interface
    //
    // nextItems is used to synchronize both sources so the displayed images
    // match the files that will actually be submitted.
  }

  function addFiles(fileList: FileList) {
    // remove any error messages left by earlier selection attempts
    // causes React to render without the previous error
    setError("");

    // calculates how many more images can be added
    const availableSlots = MAX_IMAGES - items.length;
    // converts the browser's FileList into a normal File[]
    const incomingFiles = Array.from(fileList);

    // if there are no more slots to upload more images
    if (availableSlots <= 0) {
      setError(`You can upload a maximum of ${MAX_IMAGES} images.`);
      return;
    }

    //keep only as many incoming files as there are available slots
    const selectedFiles = incomingFiles.slice(0, availableSlots);

    // loop through the selected files
    for (const file of selectedFiles) {
      // check if the files submitted are of the allowed file type
      if (!ALLOWED_TYPES.has(file.type)) {
        setError("Only JPG, WebP and PNG files are accepted.");
        return;
      }

      // check if the image size is larger than 5 MB
      if (file.size > MAX_IMAGE_SIZE) {
        setError(`${file.name} is greater than 5 MB.`);
        return;
      }
    }

    // transforms every valid File into an UploadItem
    // map() creates a new array, if three files are accepted, newItems contains 3 objects
    const newItems = selectedFiles.map((file) => {
      // create a temp URL pointing to the local file
      const previewUrl = URL.createObjectURL(file);

      // add the newly created temp URL to the previewURLs Set object for cleanup
      previewUrls.current.add(previewUrl);

      return {
        // generate a unique ID for the file
        id: crypto.randomUUID(),
        // store the actual file that will be submitted
        file,
        // store the temp URL leading to the local file
        previewUrl,
        // starts the accessibility description as an empty string
        alt: "",
      };
    });

    // add to the updated file list the items and new items
    updateInputFiles([...items, ...newItems]);

    // if the incoming files are greater than the amount of image slots left
    if (incomingFiles.length > availableSlots) {
      setError(
        `Only the first ${availableSlots} additional images were added.`,
      );
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.currentTarget.files) {
      addFiles(event.currentTarget.files);
    }
  }

  // create a function that handles the image drop event
  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    // prevent the browser's default behaviour when it comes to dragging and dropping images
    event.preventDefault();
    // add the dropped files to the updated file list
    addFiles(event.dataTransfer.files);
  }

  // create a function that will remove images using the image ID
  function removeImage(id: string) {
    const removed = items.find((item) => item.id === id);

    // if the image selected for removal's ID exists
    if (removed) {
      // delete the temp URL from the browser's storage
      URL.revokeObjectURL(removed.previewUrl);
      // delete the URL from the previewUrls Set
      previewUrls.current.delete(removed.previewUrl);
    }

    // items.filter((item) => item.id !== id) checks every image in items and makes a new array
    // for each image that item.id !== id it returns either true (keep) or false (remove)
    // updateInputFiles() receives the new array and synchronizes the react items state + browser input files
    // ensures the removed image is neither displayed nor submitted
    updateInputFiles(items.filter((item) => item.id !== id));
  }

  // defines a function that moves an image one position backward or forward
  // has 2 params:
  // index is the current array position of the image
  // direction : -1 | 1 allows 2 values:
  // -1 to move one position towards the beginning
  // 1 to move one position towards the end
  function moveImage(index: number, direction: -1 | 1) {
    // calc the target index
    const destination = index + direction;

    // stops the function if the index position is outside the array
    if (destination < 0 || destination >= items.length) {
      return;
    }

    // creates a new array containing the same items
    const nextItems = [...items];
    // swaps the current image with the image at the destination
    // its literally just nextItems[index] = nextItems[destination] and vice versa
    // its basically when you click the arrow on an image gallery
    [nextItems[index], nextItems[destination]] = [
      nextItems[destination],
      nextItems[index],
    ];

    // update both the displayed order and the order of files submitted by the form
    updateInputFiles(nextItems);
  }

  // moves the image at index to the beginning of the array
  // the first image in the array is treated as the primary image and the title picture
  function makePrimary(index: number) {
    // retrieves the image at a certain index
    const selected = items[index];

    // if the selcted image is null or doesn't exist
    if (!selected) {
      return;
    }

    // creates a new array containing the selected img first and every other image afterwards
    updateInputFiles([
      // the first image sitting at index 0
      selected,
      // every other image sitting after the selected image
      // the first param is _, which represents the current item
      // the underscore communicates that the function doesn't need the item itself, only the itemIndex
      ...items.filter((_, itemIndex) => itemIndex !== index),
    ]);
  }

  // update the accessibility description for one image
  // 2 params, the string and the description you want to add
  function updateAlt(id: string, alt: string) {
    // ask react to update items
    setItems((currentItems) =>
      // create a new array by checking every image
      // map() returns one value for every existing item, so no img is added/removed
      // (item) => (item.id === id ? { ...item, alt } : item) is a ternary expression
      // means if item.id === id, it returns { ...item, alt }, then alt replaces the old alt
      // if the ids don't match, the original item is returned unchanged
      currentItems.map((item) => (item.id === id ? { ...item, alt } : item)),
    );
  }

  return (
    <div>
      {/* File selection and drop area. */}
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-border bg-background px-6 py-10 text-center transition hover:border-accent"
      >
        <input
          ref={inputRef}
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          required
          onChange={handleChange}
          className="sr-only"
        />

        <span className="font-semibold text-foreground">Drop images here</span>

        <span className="mt-1 text-sm text-muted">
          or click to select files
        </span>

        <span className="mt-3 text-xs text-muted">
          Up to 5 JPG, PNG, or WebP images — maximum 5 MB each
        </span>
      </label>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Selected image previews. */}
      {items.length > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-xl border border-border bg-background"
            >
              <div className="relative h-40">
                <Image
                  src={item.previewUrl}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />

                {index === 0 && (
                  <span className="absolute top-2 left-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                    Primary image
                  </span>
                )}
              </div>

              <div className="grid gap-3 p-3">
                <input
                  name="imageAlt"
                  value={item.alt}
                  onChange={(event) => updateAlt(item.id, event.target.value)}
                  placeholder="Describe this image"
                  aria-label={`Alternative text for ${item.file.name}`}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />

                <div className="flex flex-wrap gap-2">
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => makePrimary(index)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold"
                    >
                      Make primary
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveImage(index, -1)}
                    className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-40"
                  >
                    Move left
                  </button>

                  <button
                    type="button"
                    disabled={index === items.length - 1}
                    onClick={() => moveImage(index, 1)}
                    className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-40"
                  >
                    Move right
                  </button>

                  <button
                    type="button"
                    onClick={() => removeImage(item.id)}
                    className="rounded-md border border-red-500 px-3 py-1.5 text-xs text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
