import { ObjectId } from "mongodb";

import { getSession } from "@/app/auth/session";
import { createAddressSelectionToken } from "@/app/geocode";
import { getDb } from "@/app/mongodb";

// describes the part of a Geoapify address that the app uses
// all properties have ?. meaning they are optional, Geoapify might not return every field
type GeoapifyResult = {
  // Geoapify identifier for the place
  place_id?: string;
  // complete human-readable address
  formatted?: string;
  // first address line
  address_line1?: string;
  // the municipality could appear as either city/town depending on the place
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  // the province name and abbreviation
  state?: string;
  state_code?: string;
  // the country that the location is in
  country_code?: string;
  // the coordinates belonging to this result
  lat?: number;
  lon?: number;
};

// Geoapify returns autocomplete matches as GeoJSON features
type GeoapifyResponse = {
  features?: Array<{
    properties?: GeoapifyResult;
  }>;
};

// complete suggestion data that can be safely signed for the form
type VerifiedSuggestion = {
  placeId: string;
  formattedAddress: string;
  address: string;
  location: string;
  latitude: number;
  longitude: number;
};

export async function GET(request: Request) {
  // read the JWT from the session cookie
  const session = await getSession();

  // if the session or stored user ID is invalid
  if (!session || !ObjectId.isValid(session.userId)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // connect to the database
  const db = await getDb();

  // find the logged-in user and return only the admin field
  const user = await db
    .collection("users")
    .findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { isAdmin: 1 } },
    );

  // only administrators are allowed to use the address-search endpoint
  if (user?.isAdmin !== true) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // read the q query parameter from a URL such as:
  // /api/address-suggestions?q=123%20Main
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  // do not call Geoapify for very short searches
  if (query.length < 3) {
    return Response.json({ suggestions: [] });
  }

  // read the private API key from .env.local
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Missing GEOAPIFY_API_KEY" },
      { status: 500 },
    );
  }

  // create the request to Geoapify's autocomplete endpoint
  const geoapifyURL = new URL(
    "https://api.geoapify.com/v1/geocode/autocomplete",
  );

  geoapifyURL.searchParams.set("text", query);
  geoapifyURL.searchParams.set("filter", "countrycode:ca");
  geoapifyURL.searchParams.set("format", "geojson");
  geoapifyURL.searchParams.set("lang", "en");
  geoapifyURL.searchParams.set("limit", "5");
  geoapifyURL.searchParams.set("apiKey", apiKey);

  // request fresh suggestions instead of caching previous searches
  const response = await fetch(geoapifyURL, {
    cache: "no-store",
  });

  if (!response.ok) {
    return Response.json({ error: "Address search failed" }, { status: 502 });
  }

  // read the address properties from Geoapify's GeoJSON features
  const data = (await response.json()) as GeoapifyResponse;
  const results = Array.isArray(data.features)
    ? data.features
        .map((feature) => feature.properties)
        .filter((result): result is GeoapifyResult => result !== undefined)
    : [];

  // keep only complete Ontario addresses with usable coordinates
  const verifiedSuggestions: VerifiedSuggestion[] = results.flatMap(
    (result) => {
      const state = result.state?.toLowerCase();
      const stateCode = result.state_code?.toLowerCase();
      const location =
        result.city ??
        result.town ??
        result.village ??
        result.municipality ??
        result.county;

      if (
        !result.place_id ||
        !result.formatted ||
        !result.address_line1 ||
        !location ||
        result.country_code?.toLowerCase() !== "ca" ||
        (state !== "ontario" && stateCode !== "on") ||
        typeof result.lat !== "number" ||
        !Number.isFinite(result.lat) ||
        typeof result.lon !== "number" ||
        !Number.isFinite(result.lon)
      ) {
        return [];
      }

      return [
        {
          placeId: result.place_id,
          formattedAddress: result.formatted,
          address: result.address_line1,
          location,
          latitude: result.lat,
          longitude: result.lon,
        },
      ];
    },
  );

  // sign the trusted provider values so the browser cannot alter the coordinates
  const suggestions = await Promise.all(
    verifiedSuggestions.slice(0, 5).map(async (suggestion) => ({
      placeId: suggestion.placeId,
      formattedAddress: suggestion.formattedAddress,
      address: suggestion.address,
      location: suggestion.location,
      addressToken: await createAddressSelectionToken(suggestion),
    })),
  );

  return Response.json({ suggestions });
}
