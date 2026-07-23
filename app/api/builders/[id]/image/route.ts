// Binary represents binary data returned by MongoDB
import { Binary, ObjectId } from "mongodb";

import { getDb } from "@/app/mongodb";

// describes an image stored in MongoDB
type StoredImage = {
  // image bytes may be returned as MongoDB Binary or JavaScript Uint8Array
  data: Binary | Uint8Array;
  // stores the image format, i.e: JPEG, WEBP, PNG
  contentType: string;
  // stores the file name
  fileName: string;
  // stores the file size
  size: number;
};

// describes the dynamic URL parameter
// if the route file is located at app/api/builders/[id]/image/route.ts
// replaces [id] with the user's id
// params eventually becomes { id: "abc123" }
type RouteContext = {
  params: Promise<{ id: string }>;
};

// Next.js calls this function when the route receives a GET request
// the underscore in _request indicates that the request argument is intentionally unused
export async function GET(_request: Request, { params }: RouteContext) {
  // get the listing id from the url
  const { id } = await params;

  // reject invalid MongoDB ids
  if (!ObjectId.isValid(id)) {
    return new Response("Image not found", {
      status: 404,
    });
  }

  // connect to database
  const db = await getDb();

  // pull stored images from collection "builders"
  const builder = await db
    .collection<{ images?: StoredImage[] }>("builders")
    // match id to one in database then only pull the first image instead of the whole listing
    .findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          images: { $slice: 1 },
        },
      },
    );
  // extract the image from builder
  // the chaining means if builder exists, inspect images, if images exists, retrieve its first item
  // otherwise, return undefined
  const image = builder?.images?.[0];

  // if image returns undefined, meaning the builder either doesn't exist or has no stored image
  if (!image) {
    // return new response and return an error 404
    return new Response("Image not found", {
      status: 404,
    });
  }

  // extract the bytes
  const binaryData =
    // checks which binary type MongoDB returned
    // if it's MongoDB binary, image.data.buffer extracs its bye array
    // otherwise, it's already a Uint8Array and can be used directly
    // ? means if, : means otherwise
    image.data instanceof Binary ? image.data.buffer : image.data;

  // copies the original bytes into a Uint8Array
  // accesses its underlying ArrayBuffer
  // produces a valid response body w/o changing the image bytes
  const responseBody = Uint8Array.from(binaryData).buffer;

  // retruns the binary image w/ HTTP status 200, meaning success
  return new Response(responseBody, {
    // set HTTP status to 200
    status: 200,

    headers: {
      // tells the browser how to interpret the bytes
      "Content-Type": image.contentType,

      // tells the browser exactly how many bytes are in the response
      // HTTP header values must be strings, which is why the number is passed through String()
      "Content-Length": String(responseBody.byteLength),

      // allows browsers and shared caches to retain the image for 3600 seconds, or 1 hour
      // it holds it for an hour so it can reload it if the page is opened again without having to download the fiel again
      // without caching, the browser may repeatedly request the same image when the user:
      // refreshes the page, revisits a listing, etc
      "Cache-Control": "public, max-age=3600",
    },
  });
}
