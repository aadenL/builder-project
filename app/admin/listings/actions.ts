"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { getSession } from "@/app/auth/session";
import { getDb } from "@/app/mongodb";

// imports the signed address verifier from geocode.ts
// it verifies that the address and coordinates came from the autocomplete route
import { verifyAddressSelectionToken } from "@/app/geocode";

import sharp from "sharp";

// defining the schema requirements for each value
const listingSchema = z.object({
  // has to be a string, must be trimmed of whitespace on both sides, and must be minimum 1 character
  name: z.string().trim().min(1),
  developer: z.string().trim().min(1),
  location: z.string().trim().min(1),
  address: z.string().trim().min(1),
  addressToken: z.string().trim().min(1),
  type: z.string().trim().min(1),
  conStatus: z.enum(["Pre-construction", "Under construction", "Completed"]),
  ceilings: z.string().trim().min(1),
  deposit: z.string().trim().min(1),

  // .coerce is an object that holds conversion methods such as .number, .string, .boolean, and so on
  // z.coerce.number().min(0) means the price field must be converted to a number if possible that is minimum 0
  // same for the rest of these values
  price: z.coerce.number().min(0),
  beds: z.coerce.number().min(1),
  baths: z.coerce.number().min(1),
  garage: z.coerce.number().min(0),
  sqft: z.coerce.number().min(0),

  desc: z.string().trim().min(1),
  listStatus: z.string().trim().min(1),

  // must be a string
  features: z.array(z.string().trim()).default([]),
  tags: z.array(z.string().trim()).default([]),
});

export async function createListing(formData: FormData) {
  // read the JWT stored in the session cookie
  const session = await getSession();

  // if there is no session or the userId is invalid in the session
  if (!session || !ObjectId.isValid(session.userId)) {
    // redirect user to login page
    redirect("/login");
  }

  // connect to database
  const db = await getDb();

  // wait for connection to database then pull users connection
  // find userId
  const user = await db.collection("users").findOne(
    // converts userId back into ObjectId
    // finds which userId matches this value
    { _id: new ObjectId(session.userId) },

    // projection tells MongoDB which values to return
    // return the email and if they are an admin
    { projection: { email: 1, isAdmin: 1 } },
  );

  // if the user is not an admin
  // ?. is there because if it is null or undefined it won't cause an error it will just return undefined
  if (!user?.isAdmin) {
    // redirect to login page
    redirect("/login");
  }

  // Read every file submitted by <input name="images" type="file" multiple />.
  const imageEntries = formData.getAll("images");

  // Reject an empty submission or any entry that is not a real, non-empty File.
  // every() uses a type predicate, so TypeScript narrows imageEntries to File[].
  if (
    imageEntries.length === 0 ||
    !imageEntries.every(
      (entry): entry is File => entry instanceof File && entry.size > 0,
    )
  ) {
    throw new Error("Please select at least one valid image");
  }

  const images = imageEntries;

  // Repeat the browser's five-image limit on the server because client-side
  // validation can be bypassed by sending a custom request.
  if (images.length > 5) {
    throw new Error("You can upload a maximum of 5 images");
  }

  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  const maxSize = 5 * 1024 * 1024;

  // Validate the MIME type and size of every uploaded image.
  for (const image of images) {
    if (!allowedTypes.has(image.type)) {
      throw new Error(`${image.name} must be a JPG, PNG, or WebP`);
    }

    if (image.size > maxSize) {
      throw new Error(`${image.name} cannot be larger than 5 MB`);
    }
  }

  // because of the way these values are inputted into MongoDB, some of them may have whitespace or be the wrong variable type
  // so the listingSchema makes sure that everything is formatted properly
  // and safeParse makes sure every value is valid, if they are all valid, it returns the parsed data
  // use safeParse instead of parse because it won't throw an error if there are invalid values
  const result = listingSchema.safeParse({
    // get the name from the formData
    // same thing for the rest of these but for their respective fields
    name: formData.get("name"),
    developer: formData.get("developer"),
    location: formData.get("location"),
    address: formData.get("address"),
    addressToken: formData.get("addressToken"),
    type: formData.get("type"),
    conStatus: formData.get("conStatus"),
    ceilings: formData.get("ceilings"),
    deposit: formData.get("deposit"),
    price: formData.get("price"),
    beds: formData.get("beds"),
    baths: formData.get("baths"),
    garage: formData.get("garage"),
    sqft: formData.get("sqft"),
    desc: formData.get("desc"),
    listStatus: formData.get("listStatus"),
    features: formData.getAll("features"),
    tags: formData.getAll("tags"),
  });

  // if result.success returns false
  if (!result.success) {
    // identify which fields failed without exposing their submitted values
    const invalidFields = [
      ...new Set(
        result.error.issues.map((issue) => issue.path.join(".") || "form"),
      ),
    ];

    throw new Error(`Invalid listing fields: ${invalidFields.join(", ")}`);
  }

  // verify the signed Geoapify suggestion instead of geocoding its text again
  const verifiedAddress = await verifyAddressSelectionToken(
    result.data.addressToken,
  );

  // Alt inputs are rendered in the same order as the files, so each description
  // can be paired with the image at the matching array index.
  const imageAlts = formData
    .getAll("imageAlt")
    .map((value) => String(value).trim());

  // Convert all web File objects into Node.js Buffers that MongoDB can store.
  // Promise.all reads the independent image files concurrently.
  const storedImages = await Promise.all(
    images.map(async (image, index) => ({
      data: Buffer.from(await image.arrayBuffer()),
      contentType: image.type,
      fileName: image.name,
      size: image.size,
      alt: imageAlts[index] ?? "",
    })),
  );

  const listingId = new ObjectId();
  const listingData = listingSchema
    .omit({ addressToken: true })
    .parse(result.data);

  await db.collection("builders").insertOne({
    _id: listingId,
    ...listingData,

    // save Geoapify's verified address and coordinates
    address: verifiedAddress.address,
    location: verifiedAddress.location,
    addressPlaceId: verifiedAddress.placeId,
    mapLocation: verifiedAddress.mapLocation,

    img: `/api/builders/${listingId.toString()}/image?index=0`,

    // info needed by the gallery without loading the image bytes
    // imageCount = the amount of stored images
    imageCount: storedImages.length,
    // imageAlts = all image alt descriptions mapped to themselves
    imageAlts: storedImages.map((image) => image.alt),

    // Array order is preserved; the first image is the primary/card image.
    images: storedImages,
  });

  // revalidatePath tells Next.js that the homepage has changed, so throw away the cached version and reload the information
  revalidatePath("/");

  // redirect the user to the new listing page they just created
  // .toString() is needed because the insertedId is an ObjectId, and those can't be inserted into urls
  // therefore, it needs to be converted to a string so the url is valid
  redirect(`/builders/${listingId.toString()}`);
}
