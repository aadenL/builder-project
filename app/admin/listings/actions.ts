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

// importing sharp to resize images before storing them in the database
import sharp from "sharp";

import { requireAdmin } from "../requireAdmin";

export async function deleteListing(listingId: string) {
  // the {} are needed because requireAdmin() returns an object with db and userId
  // the db is needed to delete the listing and the userId is not needed for this func
  const { db } = await requireAdmin();

  // ObjectId.isValid checks if the listingId is a valid ObjectId
  if (!ObjectId.isValid(listingId)) {
    throw new Error("Invalid listing ID");
  }

  // deleteOne deletes a single document from the collection that matches the filter
  const result = await db.collection("builders").deleteOne({
    _id: new ObjectId(listingId),
  });

  // if the deletedCount is not 1, it means the listing was not found so nothing was removed
  if (result.deletedCount !== 1) {
    throw new Error("Listing not found");
  }

  // revalidatePath tells Next.js that the homepage and admin listing pages have changed
  // so throw away the cached version and reload the info
  revalidatePath("/");
  revalidatePath("/admin/listings");
}

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

const updateListingSchema = listingSchema.omit({
  address: true,
  location: true,
  addressToken: true,
});

function splitCommaSeparated(value: FormDataEntryValue | null): string[] {
  return [
    ...new Set(
      String(value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export async function updateListing(listingId: string, formData: FormData) {
  const { db } = await requireAdmin();

  if (!ObjectId.isValid(listingId)) {
    throw new Error("Invalid listing ID");
  }

  const result = updateListingSchema.safeParse({
    name: formData.get("name"),
    developer: formData.get("developer"),
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

    features: splitCommaSeparated(formData.get("features")),

    tags: splitCommaSeparated(formData.get("tags")),
  });

  if (!result.success) {
    const invalidFields = [
      ...new Set(
        result.error.issues.map((issue) => issue.path.join(".") || "form"),
      ),
    ];

    throw new Error(`Invalid listing fields: ${invalidFields.join(", ")}`);
  }

  const updateResult = await db.collection("builders").updateOne(
    {
      _id: new ObjectId(listingId),
    },
    {
      $set: {
        ...result.data,

        updatedAt: new Date(),
      },
    },
  );

  if (updateResult.matchedCount !== 1) {
    throw new Error("Listing not found");
  }

  revalidatePath("/");
  revalidatePath("/admin/listings");
  revalidatePath(`/builders/${listingId}`);
  revalidatePath(`/admin/listings/${listingId}/edit`);

  redirect(`/builders/${listingId}`);
}

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

  /**
   * Start of the sharp implementation
   *
   * Sharp is a server-side image processing library that allows you to resize, crop,
   * and convert images to different formats. In this app, it processes each uploaded image before
   * MongoDB stores it.
   */

  // setting the max size of one processed image to 3 MB
  const maximumProcessedImageSize = 3 * 1024 * 1024;

  // Resize and compress each image to reduce its file size before storing it in the database.
  // leaving room below MongoDB's 16 MB document size limit
  const maximumTotalImageSize = 14 * 1024 * 1024;

  // defining an array to hold the images
  const storedImages = [];

  // process one image at a time to avoid using unnecessary memory
  // images.entries return an array of [index, image] pairs
  for (const [index, image] of images.entries()) {
    // converting the File object into a Node.js Buffer so that sharp is able to process it
    const originalBuffer = Buffer.from(await image.arrayBuffer());

    // resize and convert the image to webp format, which takes less space than jpg or png
    // data: processedBuffer, info is destructuring the object returned by sharp() into 2 variables
    // processedBuffer holds the resized image data
    // info holds the metadata such as the width, heigh, and format of the processed image
    // await sharp is used to process the image asynchronously
    // it will alter the image to have a max width and height of 2000 px while maintaining the aspect ratio
    const { data: processedBuffer, info } = await sharp(originalBuffer, {
      // autoOrient is automatically used to rotate the image based on its EXIF orientation metadata
      // EXIF is a standard for storing metadata in image files
      // it includes info about the camera settings, date and time, and the image orientation
      autoOrient: true,
      // limitInputPixels is a feature that allows sharp to process images with a lot of pixels
      // it is set to 40 million pixes, which allows it to process images up to 8000x5000 px or 5000x8000 px
      // needed because otherwise sharp will throw an error if the image is too large
      limitInputPixels: 40_000_000,
      // .resize resizes the image to fit within defined dimensions while maintaining the aspect ratio
    })
      .resize({
        // resize the image to fit within a 1800x1500 px box while keeping the aspect ration
        width: 1800,
        height: 1800,

        // fit is a property that determines how the image is resized to fit within a specified width and height
        // "inside" means the image will be resized to fit within the specified dimensions of 1800x1800 without cropping
        // without this, the image may be stretched or distorted, ruining the image quality
        fit: "inside",

        // withoutEnlargement prevents the image from being enlarged if it's smaller than 1800x1800
        withoutEnlargement: true,
        // .webp converts the image to webp format
      })
      .webp({
        // quality determines the compression level of the image
        // 100 is the highest quality and largest file, 0 is the lowest quality and smallest file
        quality: 82,

        // effort is the amount of time spent optimizing the image for size and quality
        // the higher it is, the longer Sharp will take to process the image
        effort: 4,
        // .toBuffer returns a promise with the processed image data as a Node.js Buffer
      })
      .toBuffer({
        // resolveWithObject: true means that the promise returned by toBuffer() will resolve
        // with an Object containing both the processed image and its metadata
        resolveWithObject: true,
      });

    if (processedBuffer.length > maximumProcessedImageSize) {
      throw new Error(
        `${image.name} is still too large after image processing`,
      );
    }

    // remove the original extension from the image name and replace it with .webp
    // the regex just means "match the last dot in the string and everything after it"
    const webpFileName = image.name.replace(/\.[^.]+$/, "") + ".webp";

    // storing processed image info into the storedImages array
    // this is done so that the images as a whole can be stored in the database as an array of objects
    storedImages.push({
      // adding the processed image metadata
      data: processedBuffer,

      // storing the image type
      contentType: "image.webp",

      // storing the file name with the .webp extension
      fileName: webpFileName,

      // storing the size of the processed image
      size: processedBuffer.length,

      // storing the image height and width
      width: info.width,
      height: info.height,

      // storing the alt text for the image if it was provided, otherwise leave it empty
      alt: imageAlts[index] ?? "",
    });
  }

  const floorplanImageEntry = formData.get("floorplanImage");

  const floorplanImage =
    floorplanImageEntry instanceof File && floorplanImageEntry.size > 0
      ? floorplanImageEntry
      : null;

  const floorplanImageAlt = String(
    formData.get("floorplanImageAlt") ?? "",
  ).trim();

  if (floorplanImage) {
    if (!allowedTypes.has(floorplanImage.type)) {
      throw new Error("Floor plan image must be a JPG, PNG, or WebP");
    }
  }

  if (floorplanImage && floorplanImage.size > maxSize) {
    throw new Error("Floor plan image cannot be larger than 5 MB");
  }

  const listingId = new ObjectId();
  const listingData = listingSchema
    .omit({ addressToken: true })
    .parse(result.data);

  let storedFloorplanImage = null;

  if (floorplanImage) {
    const originalBuffer = Buffer.from(await floorplanImage.arrayBuffer());

    const { data, info } = await sharp(originalBuffer, {
      autoOrient: true,
      limitInputPixels: 40_000_000,
    })
      .resize({
        width: 2000,
        height: 2000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 85,
        effort: 4,
      })
      .toBuffer({ resolveWithObject: true });

    storedFloorplanImage = {
      data,
      contentType: "image/webp",
      fileName: floorplanImage.name.replace(/\.[^.]+$/, "") + ".webp",
      size: data.length,
      width: info.width,
      height: info.height,
      alt: floorplanImageAlt,
    };
  }

  // check the total size of all processed images to ensure it doesn't exceed the max total image size
  const totalImageSize =
    // total is the accumulated size of all imgs processed so far
    // image is the current image being processed
    // total + image.size adds the size of the current image to the accumulated total
    // the 0 at the end is the initial value of total, which is 0 before any imgs are processed
    storedImages.reduce((total, image) => total + image.size, 0) +
    (storedFloorplanImage?.size ?? 0);

  // if the total size of all processed images exceeds the max total image size, throw an error
  if (totalImageSize > maximumTotalImageSize) {
    throw new Error(
      "The combined processed images are too large. Please remove an image or upload smaller images",
    );
  }

  await db.collection("builders").insertOne({
    _id: listingId,
    ...listingData,
    floorplanImage: storedFloorplanImage,
    hasFloorplanImage: storedFloorplanImage !== null,
    floorplanImageAlt,

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
