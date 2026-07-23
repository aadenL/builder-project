"use client";

import { ChangeEvent, DragEvent, useState } from "react";

export default function ImageUpload() {
  // fileName is the base, setFileName is the change, useState("") means start empty
  const [fileName, setFileName] = useState("");

  // runs when a file input's selected file changes
  // event: ChangeEvent<HTMLInputElement>:
  // event contains info about the input change
  // ChangeEvent<HTMLInputElement> tells TypeSCript that the event came from an HTML <input> element
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    // event.target refers to the input that changed, in this case the image that is being dragged and dropped
    // event.target.files contains the files selected by the user, comes in the form of a FileList, which resembles an array
    // event.target.files[0] attempts to retrieve the first selected file
    // the ?. means access index 0 only if files is not null
    const file = event.target.files?.[0];

    // if the file exists, use its name, if the value is null/undefined, use an empty string
    // updates the React fileName state
    setFileName(file?.name ?? "");
  }

  // handles a file being dragged and dropped onto a <label> containing file input
  // event contains info about the file drop
  // DragEvent<HTMLLabelElement> tells TypeScript that the drop target is a <label> element
  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    // prevents the browser's default file drop behaviour, such as opening the file in a new tab
    event.preventDefault();

    // get the first dropped file
    // event.dataTransfer contains the dragged data
    // .files[0] is the first file of the dropped file list (which in this case will be one png)
    const file = event.dataTransfer.files[0];

    // searches inside the label for the nested input
    // currentTarget is the label that owns the onDrop handler
    // querySelector("input") returns either the input or null
    const input = event.currentTarget.querySelector("input");

    // stops if no file was dropped or no nested input was found
    if (!file || !input) {
      return;
    }

    // creates a new browser-managed drag-and-drop container
    // necessary because an input's files property expects a FileList, can't be assigned to a normal array
    const transfer = new DataTransfer();

    // adds the dropped File to the new container
    transfer.items.add(file);

    // assign transfer.file to its FileList, which is input.files
    input.files = transfer.files;

    // Display the dropped file's name
    setFileName(file.name);
  }

  return (
    <label
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-border bg-background px-6 py-10 text-center transition hover:border-accent"
    >
      {/* The actual file input is visually hidden */}
      <input
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required
        onChange={handleChange}
        className="sr-only"
      />

      <span className="font-semibold text-foreground">Drop an image here</span>

      <span className="mt-1 text-sm text-muted">or click to select a file</span>

      <span className="mt-3 text-xs text-muted">
        JPG, PNG, or WebP - maximum 5 MB
      </span>

      {/* show selected file name */}
      {fileName && (
        <span className="mt-4 rounded-full bg-accent px-3 py-1 text-sm text-white">
          {fileName}
        </span>
      )}
    </label>
  );
}
