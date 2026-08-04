import "server-only";

import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";

import { getSession } from "@/app/auth/session";
import { getDb } from "@/app/mongodb";

export async function requireAdmin() {
  // connect to the session
  const session = await getSession();

  // check if user session exists or if the userId is invalid
  if (!session || !ObjectId.isValid(session.userId)) {
    redirect("/login");
  }

  // connect to the database
  const db = await getDb();

  // connect to the users collection in the database and find the user by the session UserId
  const user = await db.collection("users").findOne(
    {
      _id: new ObjectId(session.userId),
    },
    {
      // return whether they are an admin or not
      projection: {
        isAdmin: 1,
      },
    },
  );

  // if the user is not an admin, redirect them to the home page
  // the ?. operator is used to check if the user object exists before accessing the isAdmin property
  if (user?.isAdmin !== true) {
    redirect("/");
  }

  return {
    // return the database connection and userId
    db,
    userId: session.userId,
  };
}
