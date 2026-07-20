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
import {
    createSession,
    deleteSession,
} from "@/app/auth/session";

// describing the expected structure of a user doc in MongoDB
type UserDocument = {
    _id: ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
}

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

//
export async function signup(formData: FormData) {
    const result = signupSchema.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
    });

    if (!result.success) {
        redirect("/signup?error=Invalid signup information");
    }

    const { name, email, password } = result.data;
    const db = await getDb();
    const users = db.collection<UserDocument>("users");

    const existingUser = await users.findOne({ email });

    if (existingUser) {
        redirect("/signup?error=An account already exists");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let userId: ObjectId;
}