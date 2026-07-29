"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = {
  placeId: string;
  address: string;
  location: string;
  formattedAddress: string;
  addressToken: string;
};

export default function AddressAutocomplete() {
  // references the visible input so its browser validation can be updated
  const inputRef = useRef<HTMLInputElement>(null);

  // stores the text currently entered into the address field
  // setSearch is the variable that alters search
  const [search, setSearch] = useState("");

  // stores the address suggestions returned by the Geoapify api
  // setSuggestions is the variable that alters suggestions
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // stores the suggested address that was chosen by the user
  // setSelected is the variable that alters suggested
  const [selected, setSelected] = useState<Suggestion | null>(null);

  // stores an error message if suggestions cannot be loaded
  const [error, setError] = useState("");

  // runs after rendering whenever search or selected changes
  useEffect(() => {
    // stops before calling the API when:
    // an address has already been selected or the trimmed search length is < 3
    // avoids sending requests for short / meaningless input
    if (selected || search.trim().length < 3) {
      return;
    }

    // cancels an old request when the user types another character
    const controller = new AbortController();

    // schedules the API request to run after a delay
    // called debouncing, prevents an API request after every single keystore
    // without it, for every letter inputted it would send a request to Geoapify
    // typing Toronto would send 7 requests instead of just one
    const timer = setTimeout(async () => {
      // fetch address sugesstions
      // sends a GET request to the app's API route
      // if search === "123 Main st" the requested URL would look like:
      // api/address-suggestions?q=123%20Main%20St
      try {
        const response = await fetch(
          // encodeURIComponent() escapes characters that have special meanings in a URL
          // for example: encodeURIComponent("York & Main") produces York%20%26%20Main
          `/api/address-suggestions?q=${encodeURIComponent(search)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Address search failed");
        }

        // parse the response and convert it from JSON to JavaScript
        const data = (await response.json()) as {
          suggestions?: Suggestion[];
        };

        // store the returned suggestions in React state
        // the ?? operator means use data.suggestions unless it's null/undefined, otherwise use an empty array
        setSuggestions(data.suggestions ?? []);
        setError("");
      } catch (requestError) {
        // an aborted request is expected when the search changes
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setSuggestions([]);
        setError("Address suggestions could not be loaded.");
      }
      // this is the delay to the API request, it is set to 200 ms
    }, 200);

    // returns the effect's cleanup function
    // react runs this cleanup:
    // before the effect runs again beacause the search changed
    // before it runs again because selected changed
    // when the component is removed
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // effect reruns whenever either value changes
    // so when the user types new search text or the user selects or clears an address
  }, [search, selected]);

  return (
    <div className="relative grid gap-2 sm:col-span-2">
      <label htmlFor="address-search">Address *</label>

      <input
        ref={inputRef}
        id="address-search"
        required
        value={search}
        placeholder="Start typing an Ontario address"
        className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal text-foreground placeholder:text-muted/70"
        onChange={(event) => {
          setSearch(event.target.value);
          setSelected(null);
          setSuggestions([]);
          setError("");

          // typed text is not valid until the user chooses a Geoapify result
          event.currentTarget.setCustomValidity(
            "Please select an address from the suggestions.",
          );
        }}
      />

      <input type="hidden" name="address" value={selected?.address ?? ""} />
      <input type="hidden" name="location" value={selected?.location ?? ""} />
      <input
        type="hidden"
        name="addressToken"
        value={selected?.addressToken ?? ""}
      />

      {suggestions.length > 0 && (
        <div
          className="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
          aria-label="Address suggestions"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              type="button"
              className="block w-full cursor-pointer border-b border-border px-4 py-3 text-left text-sm text-foreground last:border-b-0 hover:bg-accent/10 focus:bg-accent/10 focus:outline-none"
              onClick={() => {
                setSelected(suggestion);
                setSearch(suggestion.formattedAddress);
                setSuggestions([]);
                setError("");
                inputRef.current?.setCustomValidity("");
              }}
            >
              {suggestion.formattedAddress}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
