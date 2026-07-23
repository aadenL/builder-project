"use client";

import { useState } from "react";

// declaring a TypeScript type for the field props
type MultiValueFieldProps = {
  name: string;
  label: string;
  options: string[];
};

// receives one prop and extracts 3 properties through destructuring
// name: the form field name, such as "features"
// label: the text displayed to the user, such as "Features"
// options: the available choices, such as [Pool, Gym]
export default function MultiValueField({
  name,
  label,
  options,
}: MultiValueFieldProps) {
  // selected is the current string array, setSelected updates that string array
  // <string[]> means every item must be a string, ([]) means start with an empty array
  const [selected, setSelected] = useState<string[]>([]);

  // customValue is the current string, setCustomValue updates that string
  // The initial empty state (useState("")) just means start with an empty string
  const [customValue, setCustomValue] = useState("");

  // defines a function that receives the value the user wants to add
  function addValue(value: string) {
    // trims the whitespaces on both ends
    const cleanedValue = value.trim();

    // if cleanedValue is empty or a duplicate that already exists in the database
    if (!cleanedValue || selected.includes(cleanedValue)) {
      // return
      return;
    }

    // adds the cleaned value to the array
    /**
     * if current = ["Pool", "Gym"] and cleanedValue = "Concierge"
     * then [...current, cleanedValue] makes ["Pool", "Gym", "Concierge"]
     * the spread operator (...current) copies all existing items into a new array
     */
    setSelected((current) => [...current, cleanedValue]);

    // clear the custom input
    setCustomValue("");
  }

  // defining a function that removes a particular string from the selected values
  function removeValue(value: string) {
    // this updates the selected state using the latest array
    // filter() creates a new array containing items that pass the condition item !== value
    // for example, if the current features array includes "Gym" and you try to add "Gym", it wont add it
    // setSelected((current) => current.filter((item) => item !== value)) means:
    // change state from current into an updated version containing only items that pass the condition
    setSelected((current) => current.filter((item) => item !== value));
  }

  return (
    <fieldset className="rounded-xl border border-border bg-background/60 p-4">
      {/* Displays the field name inside the fieldset border. */}
      <legend className="px-2 text-sm font-bold text-foreground">
        {label}
      </legend>

      {/* Existing-value section populated by distinct values from MongoDB. */}
      <div className="grid gap-2">
        {/* Connects the label to the dropdown for accessibility. */}
        <label
          htmlFor={`${name}-existing`}
          className="text-xs font-semibold uppercase tracking-wide text-muted"
        >
          Choose existing
        </label>
        {/* Selecting an option immediately adds it to the selected array. */}
        <select
          id={`${name}-existing`}
          value=""
          onChange={(event) => addValue(event.target.value)}
          className="w-full cursor-pointer rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground"
        >
          <option value="">Select {label.toLowerCase()}</option>

          {/* Create one option for every existing database value. */}
          {options.map((option) => (
            <option
              key={option}
              value={option}
              disabled={selected.includes(option)}
            >
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Custom-value section for a feature or tag that does not exist yet. */}
      <div className="mt-4 grid gap-2">
        <label
          htmlFor={`${name}-custom`}
          className="text-xs font-semibold uppercase tracking-wide text-muted"
        >
          Or add your own
        </label>
        {/* Keeps the custom input and Add button together. */}
        <div className="flex flex-col gap-2 sm:flex-row">
          {/* This controlled input stores its text in customValue. */}
          <input
            id={`${name}-custom`}
            value={customValue}
            onChange={(event) => setCustomValue(event.target.value)}
            placeholder={`New ${label.toLowerCase().slice(0, -1)}`}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70"
          />

          {/* type="button" prevents submission of the full listing form. */}
          <button
            type="button"
            onClick={() => addValue(customValue)}
            disabled={!customValue.trim()}
            className="cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>

      {/* Shows every value that will be submitted with the listing. */}
      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Selected
        </p>
        <div className="flex min-h-8 flex-wrap gap-2">
          {/* Display a helpful message until the admin chooses a value. */}
          {selected.length === 0 && (
            <span className="text-sm text-muted">None selected yet</span>
          )}
          {/* Render each selected value as a removable chip. */}
          {selected.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-3 pr-1.5 text-sm font-medium text-foreground"
            >
              {value}

              {/* Remove only this value from the selected array. */}
              <button
                type="button"
                onClick={() => removeValue(value)}
                aria-label={`Remove ${value}`}
                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-background hover:text-foreground"
              >
                ×
              </button>

              {/* FormData.getAll(name) receives one entry from each hidden input. */}
              <input type="hidden" name={name} value={value} />
            </span>
          ))}
        </div>
      </div>
    </fieldset>
  );
}
