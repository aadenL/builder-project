// only run this code on the server, not in the browser
// i am the only one who can see this code, and it will not be sent to the client
import "server-only";

// GeocodingResult is a type that represents the result of a geocoding operation
type GeocodingResult = {
  // the latitude and longitude of the geocoded location must be strings
  lat: string;
  long: string;
};

// geocodeAddress is an async function that takes an address string as input
// returns a Promise that resolves to a GeocodingResult object
export async function geocodeAddress(address: string) {
  // create a new URL object with the base URL of the Nominatim API
  const url = new URL("https://nominatim.openstreetmap.org/search");

  // set the query parameters for the URL
  // format=jsonv2 means that the response will be in JSON format
  url.searchParams.set("format", "jsonv2");
  // limit=1 means that only one result will be returned
  url.searchParams.set("limit", "1");
  // countrycodes=ca means that only results from Canada will be returned
  url.searchParams.set("countrycodes", "ca");
  // q=address means that the search query will be the address string passed to the function
  url.searchParams.set("q", address);

  // fetch the URL and wait for the response
  const response = await fetch(url, {
    // set the User-Agent header
    // a User-Agent header is a string that identifies the application making the request
    // required by the Nominatim API
    headers: {
      // set the user agent to a string that identifies the application and the developer
      "User-Agent":
        // BuilderProject/1.0 is the name and version of the application
        // contact@example.com is the email address of the developer or maintainer of the application
        "BuilderProject/1.0 (contact@example.com)",
    },
  });

  // if the response is not ok
  // meaning that the status code is not in the range 200-299
  if (!response.ok) {
    // throw an error
    throw new Error("The address could not be found");
  }

  // parse the response as JSON and cast it to an array of GeocodingResult objects
  // parsing is the process of converting a JSON string into a JavaScript object
  const results = (await response.json()) as GeocodingResult[];

  // result is the first element of the results array
  const result = results[0];

  // if the result is undefined, meaning that the first element in the GeocodingResult array is not found
  if (!result) {
    // throw an error
    throw new Error("The address could not be found");
  }

  // return an object
  return {
    // the type is a string that specifies the type of geometry, in this case "Point"
    // as const is a TypeScript assertion that tells the compiler to treat the value as a constant literal type
    // meaning that the type of the value is the exact string "Point" and not just a string
    type: "Point" as const,

    // coordinates is an array of two numbers that represent the longitude and latitude of the point
    coordinates: [
      // set the result.long value to a number using the Number() function
      Number(result.long),
      // set the result.lat value to a number using the Number() function
      Number(result.lat),
      // cast the array as a tuple of two numbers using the as [number, number] assertion
    ] as [number, number],
  };
}
