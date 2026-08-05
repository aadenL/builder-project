import { getDb } from "@/app/mongodb";
import { ObjectId, type Document } from "mongodb";

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

  // mapLocation is an optional field that may or may not be present in the Builder object
  // ?: means that the field is optional, and it may be undefined
  mapLocation?: {
    // type is a string that specifies the type of geometry, in this case "Point"
    // meaning that the coordinates are a single point on the map
    type: "Point";
    // coordinates is an array of two numbers that represent the longitude and latitude of the point
    coordinates: [number, number];
  };

  imageCount?: number;
  imageAlts?: string[];
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

export type ListingFilters = {
  query?: string;
  field?: string;
  priceRange?: string;
  sortOrder?: string;
  constructionStatus?: string;
  propertyType?: string;
  beds?: number | null;
  baths?: number | null;
};

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

export async function getBuilders({
  query = "",
  field = "",
  priceRange = "all",
  sortOrder = "default",
  constructionStatus = "all",
  propertyType = "all",
  beds = null,
  baths = null,
}: ListingFilters = {}) {
  // connect to the database
  const db = await getDb();

  // trim the query to get just the searched term without any extra spaces
  const searchTerm = query.trim();

  // check if the field is a valid search field, if not default to searching for "all"
  const searchField = isSearchField(field) ? field : "all";

  // every MongoDB aggregation step is added to this array
  // an aggregation step is a stage in the MongoDB aggregation pipeline
  // the aggregation pipeline is a series of stages that process data in a collection
  // and return the computed results
  // Document[] = [] means that the pipeline is an array of MongoDB documents, and it starts as an empty array
  const pipeline: Document[] = [];

  // if searchTerm exists
  if (searchTerm) {
    // declare searchPaths variable as an array of strings
    const selectedSearchFields =
      searchField === "all" ? [...searchFields] : [searchField];

    // pipeline.push pushes these stages into the pipeline array
    // they will be used later in the MongoDB aggregation pipeline to perform the search functionm
    pipeline.push({
      // $search performs a full-text search on the specified fields in the MongoDB collection
      // there are other kinds of searches that can be performed, such as:
      // $text, $geoNear, $regex, etc. None of these support fuzzy searching
      // $text searches for text in a specific field
      // $geoNear searches for documents that are near a specific location
      // $regex searches for documents that match a specific pattern
      $search: {
        // index is the search index that was created in MongoDB Atlas for the builders collection
        index: "builders-search",

        // compound allows for multiple search criteria to be combined into a single search query
        compound: {
          // should is an array of search criteria that are combined with a logical OR
          // meaning, if any of the search criteria in the should array match,
          // the document will be returned
          should: [
            {
              // text is the type of search to perform, in this case a full-text search
              text: {
                // query is the search term that the user entered in the search bar
                query: searchTerm,
                // path is the field(s) in the MongoDB collection to search for the query
                path: selectedSearchFields,
                // fuzzy search allows for approximate string matching,
                // meaning that the search will return results that are similar to the search term,
                // even if they are not exact matches
                fuzzy: {
                  // maxEdits is the max number of single-character edits (insertions, deletions, or substitutions)
                  // that can be made to the search term to find a match
                  maxEdits: 2,

                  // prefixLength is the num of characters at the start of the search term that must match exactly
                  prefixLength: 1,

                  // maxExpansions is the max number of variations of the search term that can be generated
                  // for example, if the search term is "house" and maxExpansions is 50,
                  // then the search will return results for "house", "houses", "housing", "houser", etc.
                  maxExpansions: 50,
                },
              },
            },

            // this allows for partial word matching
            // .map(path) is used to create a new array of search criteria for each selected search field
            ...selectedSearchFields.map((path) => ({
              // autocomplete is the type of search to perform, in this case a partial word search
              autocomplete: {
                // query is the search term that the user entered in the search bar
                query: searchTerm,
                // path is the field(s) in the MongoDB collection to search for the query
                path,
                // tokenOrder is the order in which the tokens (words) in the search term are processed
                // sequential means that the tokens must be in the same order as they appear in the search term
                // tokens are the individual words in the search term,
                // and they are generated by splitting the search term on spaces
                // so something like "Upper Stouffville" would be split into 2 tokens:
                // "Upper" and "Stouffville"
                tokenOrder: "sequential",
                // same fuzzy searching as before
                fuzzy: {
                  // the only difference is that maxEdits is set to 1 instead of 2,
                  // meaning that the search will be more strict
                  maxEdits: 1,
                  prefixLength: 1,
                  maxExpansions: 50,
                },
              },
            })),
          ],

          // at least one of the search criteria in the should array must match
          minimumShouldMatch: 1,
        },
      },
    });
  }

  // create the price filter
  // Document = {} means that the priceFilter is a MongoDB doc and it starts as an empty object
  const listingFilter: Document = {};

  // if the priceRange is set to the under-750k tag
  if (priceRange === "under-750k") {
    // set the filter to only return preconstructions that are less than $750,000
    // priceFilter.price is the field in the MongoDB collection that is being filtered
    // $lt is a MongoDB operator that means "less than"
    listingFilter.price = { $lt: 750000 };
  }

  if (priceRange === "750k-1m") {
    // $gte is a MongoDB operator that means "greater than or equal to"
    // $lte is a MongoDB operator that means "less than or equal to"
    listingFilter.price = { $gte: 750000, $lte: 1000000 };
  }

  if (priceRange === "over-1m") {
    listingFilter.price = { $gt: 1000000 };
  }

  // filter by construction status
  if (constructionStatus !== "all") {
    listingFilter.conStatus = constructionStatus;
  }

  // filter by property type
  if (propertyType !== "all") {
    listingFilter.type = propertyType;
  }

  if (beds !== null && Number.isFinite(beds)) {
    listingFilter.beds = beds >= 6 ? { $gte: 6 } : beds;
  }

  if (baths !== null && Number.isFinite(baths)) {
    listingFilter.baths = baths >= 6 ? { $gte: 6 } : baths;
  }

  // if Object.keys(priceFilter).length > 0, meaning that the priceFilter object has at least one key
  // meaning the user selected the price to be filtered by one of the 3 options
  if (Object.keys(listingFilter).length > 0) {
    // push the price filter into the pipeline
    pipeline.push({
      // $match filters the docs in the MongoDB collection based on the specified criteria
      // in this case, the criteria is the priceFilter object that was created above
      $match: listingFilter,
    });
  }

  // if the user selects to sort the builder cards by price from low to high
  if (sortOrder === "low-to-high") {
    // pipeline.push the $sort stage into the pipeline
    pipeline.push({
      // sort by the price field in ascending order (1)
      $sort: {
        price: 1,
      },
    });
  }

  // if the user selects to sort the builder cards by price from high to low
  if (sortOrder === "high-to-low") {
    // pipeline.push the $sort stage into the pipeline
    pipeline.push({
      // sort by descending order (-1)
      $sort: {
        price: -1,
      },
    });
  }

  // pipeline.push the $project stage into the pipeline
  pipeline.push({
    // $project specifies which fields to include or exclude in the final result set
    // images: 0 means do not include the image in the returned data
    $project: {
      images: 0,
    },
  });

  // assign builders to the database collection "builders" and run the pipeline on it
  const builders = await db
    .collection<BuilderDocument>("builders")
    // .aggregate runs the aggregation pipeline on the "builders" collection
    // an aggregation pipeline is stages that process data in a collection and return the computed results
    // <BuilderDocument & { _id: ObjectId }> is a type assertion that tells TypeScript
    // that the result of the aggregation will be an array of BuilderDocument objects
    // with an _id field of type ObjectId
    .aggregate<BuilderDocument & { _id: ObjectId }>(pipeline)

    // .toArray converts the aggergation result into an array of BuilderDocument objects
    .toArray();

  // return the builders array after serializing each builder doc into the app format
  // .map() iterates over each builder doc in the builders array
  // and applies the serializeBuilder function to it
  // serializeBuilder converts the MongoDB builder doc format into the app format
  // it does this by converting the _id field from an ObjectId into a string
  // we do this because the app wants _id as a string but MongoDB stores _id as an ObjectId
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
