// TLDR: This file sets up a server-only authentication actions file and describes how users are stored in MongoDB

// "use server" marks the file's exported async functions as Next.js Server Functions
// since they execute on the server, they can safely:
// connect to MongoDB
// read environment variables
// hash and compare passwords
// create and delete session cookies
// client components can invoke exported Server Functions, but the function code and secrets remain on the server
"use server";

// imports the bcryptjs password-hashing library
// used to hash a password during registration
// hashing a password means taking the OG password (ig: MyPassword123) and turning it into something like $2b$12$eP5WQq1v0bVYQjQhL8m5Ru
// the database stores the hash and not the original password
// to log in, when you enter your password it gets hashed and then comapared to the stored hash, if it fits then the login is accepted
// important for website privacy and protection
import bcrypt from "bcryptjs";

// imports mongoDB's ObjectId class
// this is needed because MongoDB docs normally have an _id that uniquely identifies them
// an ObjectId is MongoDB's identifier type, not an ordinary string, when needed you can turn one into a string
import { ObjectId } from "mongodb";

// imports Next.js's server side redirect function
// after a successful login, registration, or logout, you can send the user to another page
// redirect stops normal execution by throwing a special Next.js redirect signal.
import { redirect } from "next/navigation";

// imports Zod, which is a runtime data-validation library
// TypeScript types disappear when the application runs, so they can't validate form submissions. Zod checks real incoming data
import { z } from "zod";

// adds the MongoDB helper
import { getDb } from "@/app/mongodb";

// imports session helpers
// await createSession(user._id.toString()); creates a signed JWT containing the user's ID and stores it in the session cookie
import { createSession, deleteSession } from "@/app/auth/session";

// describing the expected structure of a user doc in MongoDB
type UserDocument = {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;

  newsletter: {
    subscribed: boolean;
    consentedAt: Date | null;
    consentSource: string | null;
    consentVersion: string | null;
    unsubscribedAt: Date | null;
    suppressed: boolean;
    suppressionReason: string | null;
  };
};

// createas a Zod schema describing valid signup info
// submitted value must be an object containing name, email, and password
const signupSchema = z.object({
  // the name must be a string, have the whitespace removed from both ends, and be > 2 characters after trimming
  // if it's too short return "Name is too short"
  name: z.string().trim().min(2, "Name is too short"),

  // the email must be a string, have the whitespace removed from both ends, be converted to lowercase, and have a valid email format
  // if it's not then return "Invalid email"
  email: z.string().trim().toLowerCase().email("Invalid email"),

  // the password must be a string and minimum 8 characters
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// login validation schema
const loginSchema = z.object({
  // same thing
  email: z.string().trim().toLowerCase().email(),
  // password must be min 1 character
  password: z.string().min(1),
});

// formData contains values submitted in a form format
/** Example:
    <form action={signup}>
    <input name="name" />
    <input name="email" />
    <input name="password" type="password" />
    </form>

    complete signup flow:
        Read form
        → validate values
        → check for existing email
        → hash password
        → insert user
        → create session cookie
        → redirect to account
*/
export async function signup(formData: FormData) {
  // read and validate the form
  // safeParse either returns:
  //  { success: true, data: /* validated data */ }
  //  { success: false, error: /* validation errors */ }
  const result = signupSchema.safeParse({
    // reads 3 form fields: name, email, password
    // passes them all into the Zod signup schema and then validates and transforms them
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // if there's any field that was invalid the result would be false, so it would redirect to signup page with an error
  if (!result.success) {
    redirect("/signup?error=Invalid signup information");
  }

  // extracting all the validated values
  const { name, email, password } = result.data;
  // connecting to database
  const db = await getDb();
  // get the "users" collection in the database
  // <UserDocument> tells TypeScript what each user doc should contain
  const users = db.collection<UserDocument>("users");

  // checking if the email exists in the database
  // would return either null or the user document
  const existingUser = await users.findOne({ email });

  // if there is an existing document, redirect user to login page with error message
  if (existingUser) {
    redirect("/signup?error=An account already exists");
  }

  // hashing password
  // password is the original entered password
  // 12 is bcrypt's computational cost
  // passwordHash is what gets stored in MongoDB
  const passwordHash = await bcrypt.hash(password, 12);

  // declares a variable that will hold the MongoDB ID after insertion
  let userId: ObjectId;

  // read whether the user consented to receiving the newsletter
  const newsletterConsent = formData.get("newsletterConsent") === "on";

  try {
    // attempts to insert a new document into users
    // insertOne() returns info about the operation
    const newAcc = await users.insertOne({
      // uniquely identifies the user
      _id: new ObjectId(),
      name,
      email,
      passwordHash,
      // provides what date the account was created at, records current date and time of account creation
      createdAt: new Date(),
      newsletter: {
        subscribed: newsletterConsent,
        consentedAt: newsletterConsent ? new Date() : null,
        consentSource: newsletterConsent ? "account-signup" : null,
        consentVersion: newsletterConsent ? "2026-08-18" : null,
        unsubscribedAt: null,
        suppressed: false,
        suppressionReason: null,
      },
    });

    // assigns userId to insertedId, which is the _id of the newly created document
    userId = newAcc.insertedId;
    // if you can't insert the new document
    // some issues could include:
    /**
     * Database connection issues
     * a duplicate email rejected by a unique index
     * an invalid doc
     * a temporary MongoDB failure
     */
  } catch {
    // redirect back to login page with error
    redirect("/signup?error=Could not create account");
  }

  // converts the MongoDB object to a string and then creates a session containing that ID
  /**
   * {
   *   userId: "mongodb-object-id"
   * }
   * the signed JWT is stored in the "session" cookie, the user is now logged in immediately after signup
   */
  await createSession(userId.toString());
  // sends the authenticated user to /account
  redirect("/account");
}

// defines login server function
/**
 * The login flow is:
 *  Form → find user → compare password against hash → create cookie → redirect
 */
export async function login(formData: FormData) {
  // reads the submitted email and password and validates them with loginSchema
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // if result.success returns false then redirect to login page with error message
  if (!result.success) {
    redirect("/login?error=Invalid email or password");
  }

  // extracting the values of both email and password from the data
  const { email, password } = result.data;

  // connecting to the database
  const db = await getDb();

  // await the database connection before running this block of code
  const user = await db
    // connect to the users collection in the database
    .collection<UserDocument>("users")
    // checking if the user's email exists in the database
    .findOne({ email });

  if (!user) {
    redirect("/login?error=Invalid email or password");
  }

  // assigning variable to see if the hashed password in the database matches to the entered password
  const passwordMatches = await bcrypt.compare(
    // the currently entered password
    password,

    // the password previously entered that was hashed and stored in the database
    user.passwordHash,
  );

  if (!passwordMatches) {
    redirect("/login?error=Invalid email or password");
  }

  // Convert the user's _id to a string and create the signed session cookie.
  await createSession(user._id.toString());
  // sends the authenticated user to /account
  redirect("/account");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
