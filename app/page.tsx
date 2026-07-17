import BuilderCard from "@/app/BuilderCard";
import { getBuilders } from "@/app/builderData"; // Imports the function that reads builder listings from MongoDB.
import Form from "next/form";

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
    query ?: string | string[];
    field ?: string | string[];
    price ?: string | string[];
    sort ?: string | string[];
  }>;
}) {
  // searchParams is a prop, must use await because earlier searchParams was declared as Promise
  const params = await searchParams;

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
  const builders = await getBuilders(searchQuery, searchField, priceRange, sortOrder);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <p className="mb-2 text-sm font-semibold tracking-[0.14em] text-accent uppercase">
        Find your next home
      </p>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Preconstruction Listings
      </h1>
      <p className="mb-8 max-w-2xl text-base text-muted sm:text-lg">
        Browse upcoming homes and compare the details that matter most.
      </p>

      <Form action="/" className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4">
        <label className="t-semibold text-foreground">
          Price range
          <select
            name="price"
            defaultValue={priceRange}
            className="search-input ml-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">Any price</option>
            <option value="under-750k">Under $750k</option>
            <option value="750k-1m">$750K to $1M</option>
            <option value="over-1m">Over $1M</option>
          </select>
        </label>

        <label className="text-sm font-semibold text-foreground">
          Sort by Price
          <select
            name="sort"
            defaultValue={sortOrder}
            className="search-input ml-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="default">Default order</option>
            <option value="low-to-high">Lowest to highest</option>
            <option value="high-to-low">Highest to lowest</option>
          </select>
        </label>

        <button
          type="submit"
          className="cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Apply
        </button>
      </Form>
      
      {/* Check the number of records returned from MongoDB before choosing the listing grid or empty state. */}
      {builders.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Render one card for every database record returned by getBuilders. */}
          {builders.map((builder) => (
            <BuilderCard key={builder._id} builder={builder} />
          ))}
        </div>
      ) : (
        // Shows a helpful empty state when there are no listings.
        <p className="rounded-xl border border-border bg-surface p-6 text-muted">
          No listings are available yet.
        </p>
      )}
    </main>
  );
} 

