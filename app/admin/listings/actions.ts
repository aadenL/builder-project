"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { getSession } from "@/app/auth/session";
import { getDb } from "@/app/mongodb";

// defining the schema requirements for each value
const listingSchema = z.object({
  // has to be a string, must be trimmed of whitespace on both sides, and must be minimum 1 character
  name: z.string().trim().min(1),
  developer: z.string().trim().min(1),
  location: z.string().trim().min(1),
  address: z.string().trim().min(1),
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

  // get the value submitted by <input name="image" type="file"/>
  // FormData.get() returns: FormDataEntryValue | null, meaning the result can be a file, string, or null
  const image = formData.get("image");

  // checks whether the image is actually a File object
  // also checks if the image size is equal to 0
  // !(image instanceof File) becomes true when image is a string, null, or some other value
  if (!(image instanceof File) || image.size === 0) {
    // throw an error to select an image
    throw new Error("Please select an image");
  }

  //
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(image.type)) {
    throw new Error("The image must be a JPG, PNG, or WebP");
  }

  const maxSize = 5 * 1024 * 1024;

  if (image.size > maxSize) {
    throw new Error("The image file cannot be larger than 5 MB");
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
    // throw an error
    throw new Error("Some listing information is invalid");
  }

  // converts the uploaded file to server-side binary data and sores it inside a new MongoDB builder doc
  // image.arrayBuffer() reads all the bytes from the uploaded File
  // returns a promise containing an array buffer, so await must be placed in front
  // an ArrayBuffer represents raw binary data, for an img it contains the actual JPEG, PNG, or WebP bytes, not the filename or URL
  // Buffer.from() converts the web-standard ArrayBuffer into a Node.js Buffer
  // Needed because the file arrives though the web-standard File API while MongoDB's Node.js driver stores binary content using Node-compatible binary data
  const imageBuffer = Buffer.from(await image.arrayBuffer());

  const listingId = new ObjectId();

  await db.collection("builders").insertOne({
    _id: listingId,
    ...result.data,

    img: `/api/builders/${listingId.toString()}/image`,

    images: [
      {
        data: imageBuffer,
        contentType: image.type,
        fileName: image.name,
        size: image.size,
      },
    ],
  });

  // revalidatePath tells Next.js that the homepage has changed, so throw away the cached version and reload the information
  revalidatePath("/");

  // redirect the user to the new listing page they just created
  // .toString() is needed because the insertedId is an ObjectId, and those can't be inserted into urls
  // therefore, it needs to be converted to a string so the url is valid
  redirect(`/builders/${listingId.toString()}`);
}
