import { getBuilders } from "@/app/builderData"; // Imports the function that reads builder listings from MongoDB.
import Form from "next/form";
import Link from "next/link";
import ListingsExplorer from "@/app/ListingsExplorer";

// Tells Next.js to render this page on each request so it always reads fresh MongoDB data.
export const dynamic = "force-dynamic"; // Makes the homepage server-render dynamically instead of relying on a static build.

export default async function Home({
  // declare searchParams as a prop
  searchParams,
}: {
  // defining what searchParams is in TypeScript type
  // Promise<...> means you must wait for searchParams with await before reading it
  // Promise is used because Next.js may need to finish getting that info before it returns it to the page
  // {...} means the result will be an object
  // query?: means the object will have a property called query, ? means it's optional because they may visit / without searching
  // string | string[] if query exists it's either one string or an array of strings if the url has the key 1+ times
  searchParams: Promise<{
    query?: string | string[];
    field?: string | string[];
    price?: string | string[];
    sort?: string | string[];
    status?: string | string[];
    type?: string | string[];
    beds?: string | string[];
    baths?: string | string[];
  }>;
}) {
  // searchParams is a prop, must use await because earlier searchParams was declared as Promise
  const params = await searchParams;

  // reads filter values from URL search params and converts the bedroom and bathroom filters into
  // usable numbers
  const getStringParameter = (
    // value may be a singular string, an array of strings, or undefined
    value: string | string[] | undefined,
    // fallback is teh default value to use when value is not one string
    fallback: string,
    // if value is not a string, return fallback (which is a string)
  ) => (typeof value === "string" ? value : fallback);

  // extract the filters from the URLs
  const constructionStatus = getStringParameter(params.status, "all");
  const propertyType = getStringParameter(params.type, "all");
  const bedsText = getStringParameter(params.beds, "all");
  const bathsText = getStringParameter(params.baths, "all");

  // Convert selected counts to numbers; "all" means no bed or bath filter.
  const beds = bedsText === "all" ? null : Number(bedsText);

  const baths = bathsText === "all" ? null : Number(bathsText);

  // params returns something like { query: "Stouffville" }, so .query just gets "Stouffville"
  const query = params.query;

  // confirms that query is a string then it trims it, if it's not a string then it returns an empty string
  // needed because query could also be undefined or an array if the query appears more than once in the url
  const searchQuery = typeof query === "string" ? query.trim() : "";

  // same thing, params returns something like { field: "location" }, so .field gets "location"
  const field = params.field;

  // confirms that field is a string and if it is then searchField = to whatever field they selected
  const searchField = typeof field === "string" ? field : "all";

  // same thing, params returns something like { price: "750000" }, so .price gets "750000", it's a string and not
  // an int because it comes from the url query and url queries are always text
  const price = params.price;

  // confirms that price is a string and if it is then priceRange = to whatever range they selected
  const priceRange = typeof price === "string" ? price : "all";

  // same thing, params returns something like { sort: "default" }, so .sort gets "default"
  const sort = params.sort;

  // confirms that sort is a string and if it is then sortOrder = to whatever order they selected
  const sortOrder = typeof sort === "string" ? sort : "default";

  // uses the getBuilders function from builderData to get searchQuery from the MongoDB database
  // await is needed because it takes time to fetch information from the database,
  // telling Next.js to stop and wait for the info to be returned before moving on
  const builders = await getBuilders({
    query: searchQuery,
    field: searchField,
    priceRange,
    sortOrder,
    constructionStatus,
    propertyType,
    baths,
    beds,
  });

  return (
    <main className="flex min-h-0 w-full flex-1 flex-col">
      <Form
        action="/"
        className="grid shrink-0 grid-cols-1 gap-3 border-b border-border bg-surface px-4 py-4 sm:grid-cols-2 sm:px-6 lg:flex lg:flex-wrap lg:items-center lg:gap-4 lg:px-8"
      >
        <input type="hidden" name="query" value={searchQuery} />

        <input type="hidden" name="field" value={searchField} />

        <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
          <span>Status</span>

          <select
            name="status"
            defaultValue={constructionStatus}
            className="search-input h-10 w-full rounded-md border border-border bg-background px-3 font-normal"
          >
            <option value="all">Any status</option>
            <option value="Pre-construction">Pre-construction</option>
            <option value="Under construction">Under construction</option>
            <option value="Completed">Completed</option>
          </select>
        </label>

        <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
          <span>Home type</span>

          <select
            name="type"
            defaultValue={propertyType}
            className="search-input h-10 w-full rounded-md border border-border bg-background px-3 font-normal"
          >
            <option value="all">Any type</option>
            <option value="Detached">Detached</option>
            <option value="Townhome">Townhome</option>
            <option value="Condo">Condo</option>
          </select>
        </label>

        <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
          <span>Beds</span>

          <select
            name="beds"
            defaultValue={bedsText}
            className="search-input h-10 w-full rounded-md border border-border bg-background px-3 font-normal"
          >
            <option value="all">Any beds</option>
            <option value="1">1 bed</option>
            <option value="2">2 beds</option>
            <option value="3">3 beds</option>
            <option value="4">4 beds</option>
            <option value="5">5 beds</option>
            <option value="6">6+ beds</option>
          </select>
        </label>

        <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
          <span>Baths</span>

          <select
            name="baths"
            defaultValue={bathsText}
            className="search-input h-10 w-full rounded-md border border-border bg-background px-3 font-normal"
          >
            <option value="all">Any baths</option>
            <option value="1">1 bath</option>
            <option value="2">2 baths</option>
            <option value="3">3 baths</option>
            <option value="4">4 baths</option>
            <option value="5">5 baths</option>
            <option value="6">6+ baths</option>
          </select>
        </label>

        <Link
          href="/"
          className="flex h-10 w-full items-center justify-center rounded-md border border-border px-5 text-sm font-semibold sm:w-auto"
        >
          Clear filters
        </Link>

        <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
          <span>Price range</span>
          <select
            name="price"
            defaultValue={priceRange}
            className="search-input h-10 w-full rounded-md border border-border bg-background px-3 font-normal"
          >
            <option value="all">Any price</option>
            <option value="under-750k">Under $750k</option>
            <option value="750k-1m">$750K to $1M</option>
            <option value="over-1m">Over $1M</option>
          </select>
        </label>

        <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
          <span>Sort by price</span>
          <select
            name="sort"
            defaultValue={sortOrder}
            className="search-input h-10 w-full rounded-md border border-border bg-background px-3 font-normal"
          >
            <option value="default">Default order</option>
            <option value="low-to-high">Lowest to highest</option>
            <option value="high-to-low">Highest to lowest</option>
          </select>
        </label>

        <button
          type="submit"
          className="h-10 w-full rounded-md bg-accent px-6 text-sm font-semibold text-white sm:w-auto"
        >
          Apply
        </button>
      </Form>

      {/* Check the number of records returned from MongoDB before choosing the listing grid or empty state. */}
      {builders.length > 0 ? (
        // ListingsExplorer keeps listing-card and map-marker interactions synchronized.
        <ListingsExplorer listings={builders} />
      ) : (
        <p className="mx-auto max-w-6xl rounded-xl border border-border bg-surface p-6 text-muted">
          No listings are available yet.
        </p>
      )}
    </main>
  );
}
