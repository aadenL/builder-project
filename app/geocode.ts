// only run this code on the server, not in the browser
// i am the only one who can see this code, and it will not be sent to the client
import "server-only";
import { SignJWT, jwtVerify } from "jose";

// describes a complete suggestion returned by the protected autocomplete route
type AddressSelection = {
  placeId: string;
  address: string;
  location: string;
  latitude: number;
  longitude: number;
};

// use the existing server secret to prevent address coordinates being altered
const secret = process.env.SESSION_SECRET;

if (!secret) {
  throw new Error("Missing SESSION_SECRET");
}

const encodedSecret = new TextEncoder().encode(secret);

// create a short-lived signed token containing Geoapify's trusted result
export async function createAddressSelectionToken(selection: AddressSelection) {
  return new SignJWT({
    placeId: selection.placeId,
    address: selection.address,
    location: selection.location,
    latitude: selection.latitude,
    longitude: selection.longitude,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer("builder-project")
    .setAudience("listing-address")
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(encodedSecret);
}

// verify that the submitted selection was signed by this application
export async function verifyAddressSelectionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ["HS256"],
      issuer: "builder-project",
      audience: "listing-address",
    });

    const { placeId, address, location, latitude, longitude } = payload;

    if (
      typeof placeId !== "string" ||
      typeof address !== "string" ||
      typeof location !== "string" ||
      typeof latitude !== "number" ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      typeof longitude !== "number" ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new Error("Invalid address selection");
    }

    return {
      placeId,
      address,
      location,
      mapLocation: {
        type: "Point" as const,
        // MongoDB GeoJSON stores longitude before latitude
        coordinates: [longitude, latitude] as [number, number],
      },
    };
  } catch {
    throw new Error("Please select the address from the suggestions again");
  }
}
