import { getDb } from "@/app/mongodb";
import { ObjectId, type Filter } from "mongodb";

export type Builder = {
  _id: string;
  developer: string;
  name: string;
  location: string;
  address: string;
  type: string;
  conStatus: string;
  ceilings: string;
  deposit: string;
  price: number;
  beds: number;
  baths: number;
  garage: number;
  sqft: number;
  desc: string;
  listStatus: string;
  img: string;
  features: string[];
  tags: string[];
};

const searchFields = [
  "name",
  "developer",
  "location",
  "address",
  "type",
  "features",
  "tags",
] as const;

type SearchField = (typeof searchFields)[number] | "all";

function isSearchField(field: string): field is SearchField {
  return (
    field === "all" ||
    searchFields.includes(field as (typeof searchFields)[number])
  );
}

//creates a new type based on Builder, but without _id
//does this because the app wants _id as a string, but mongoDB stores _id as an ObjectId
type BuilderDocument = Omit<Builder, "_id">;

//this function takes the MongoDB builder document, convert its _id from ObjectId into a normal string, then return it to the app.
function serializeBuilder(
  builder: BuilderDocument & { _id: ObjectId },
): Builder {
  return {
    //copies all fields from the mongoDb document into the new object
    ...builder,
    //overrides _id and turns it into a string since the app is asking for a string
    _id: builder._id.toString(),
  };
}

// Returns every builder listing from MongoDB.
// query = "" makes it so that the function still works when no search term is provided, query will contain the input from the search
export async function getBuilders(
  query = "",
  field = "",
  priceRange = "all",
  sortOrder = "default",
) {
  // Open (or reuse) the database connection before asking MongoDB for all listings.
  const db = await getDb();

  // trim the query entry to remove extra spaces
  const searchTerm = query.trim();

  // only allow the search fields above, otherwise make the field selected all
  const searchField = isSearchField(field) ? field : "all";

  // escapes regex and removes special terms to get the base query. i.e: Stouffville\! becomes Stouffville
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // textMatch is a reusable MongoDB search rule
  // it means to look for the search text anywhere in a field, and ignore uppercase/lowercase differences
  // $regex tells MongoDB to use a regular expression search
  // escapedSearchTerm is the cleaned and trimmed search input
  // $options = "i" just means it isnt case sensitive
  const textMatch = {
    $regex: escapedSearchTerm,
    $options: "i",
  };

  // creates an object that maps each allowed search category into its MongoDB filter
  // SearchField contains the field choices
  // Exclude<SearchField, "all"> removes all from that list
  // all is not a real tag because it just means search across every real field, which is the default
  // Record<..., ...> make sure that fieldFilters has one filter for every search option except all
  // so there's no error thrown when they try to select a certain field
  // Filter<BuilderDocument> means every entry must be a valid MongoDB filter for a builder listing
  const fieldFilters: Record<
    Exclude<SearchField, "all">,
    Filter<BuilderDocument>
  > = {
    name: { name: textMatch },
    developer: { developer: textMatch },
    location: { location: textMatch },
    address: { address: textMatch },
    type: { type: textMatch },
    features: { features: textMatch },
    tags: { tags: textMatch },
  };

  //  selects which filter MongoDB uses
  // meaning:
  // if there is no search text: use {}
  // otherwise, if the selected filter is "all": use $or with every field filter
  // $or means match if at least one of these conditions is true
  // means when the user chooses “All fields,”
  // return a listing if the search text appears in its name OR developer OR location OR address OR type OR features OR tags.
  // if the user selects Location, $or isn't used, MongoDB only uses location contains "Markham"
  // otherwise: use only the filter for the selected field
  const filter: Filter<BuilderDocument> = !escapedSearchTerm
    ? {}
    : searchField === "all"
      ? { $or: Object.values(fieldFilters) }
      : fieldFilters[searchField];

  // $lt means less than, so this means find listings where the price is less than $750,000
  if (priceRange === "under-750k") {
    filter.price = { $lt: 750000 };
  }

  // means find listings where the price is more than $750,000 but less than $1M
  if (priceRange === "750k-1m") {
    filter.price = { $gte: 750000, $lte: 1000000 };
  }

  // means find listings where the price is more than $1M
  if (priceRange === "over-1m") {
    filter.price = { $gt: 1000000 };
  }

  // Start a query against the MongoDB collection that holds builder listings.
  const builders = await db
    //selects the MongoDB collection named builders, <BuilderDocument> tells TypeScript what kind of docs are in the collection
    .collection<BuilderDocument>("builders")
    // finds the document under the filter that you selected

    .find(filter, {
      projection: { images: 0 },
    })

    // .sort tells MongoDB the order to return the matching listings
    .sort(
      sortOrder === "low-to-high"
        ? // { price: 1 } means lowest price first
          { price: 1 }
        : sortOrder === "high-to-low"
          ? // { price: -1 } means highest price first
            { price: -1 }
          : {},
    )

    // Wait for MongoDB's documents and put them in a normal JavaScript array.
    .toArray();

  // Convert every returned MongoDB document's ObjectId into the string ID used by the rest of the app.
  return builders.map(serializeBuilder);
}

//returns builder by id
export async function getBuilderById(id: string) {
  //gets the database
  const db = await getDb();

  //checks if the string is a valid MongoDb ObjectId
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const builder = await db
    .collection<BuilderDocument>("builders")

    //finds the one doc (builder) in the MongoDb database that the _id matches the id
    .findOne({ _id: new ObjectId(id) }, { projection: { images: 0 } });

  //if MongoDB finds a builder, convert it into app format and return it, else return null
  return builder ? serializeBuilder(builder) : null;
}
