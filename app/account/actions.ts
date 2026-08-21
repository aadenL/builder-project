"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";

import { getSession } from "@/app/auth/session";
import { getDb } from "@/app/mongodb";

export async function updateNewsletterPref(formData: FormData) {
  // read and verify the session JWT from the browser's session cookie
  const session = await getSession();

  // if there is no session JWT or the userId is invalid throw an error
  if (!session || !ObjectId.isValid(session.userId)) {
    throw new Error("You must be logged in");
  }

  // reading the checkbox, will return either true / false because the checkbox will return either on or off
  const subscribed = formData.get("newsletterSubbed") === "on";

  // connect to MongoDB database
  const db = await getDb();

  // search for the user whose _id matches the authenticated session
  // will return only the id
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(session.userId) }, { projection: { _id: 1 } });

  if (!user) {
    throw new Error("Account not found");
  }

  // run when the checkbox is checked
  if (subscribed) {
    // updateOne() will update the matching user, $set creates/replaces the listed fields without replacing
    // the entire user doc
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          // updates a field inside a nested object
          "newsletter.subscribed": true,
          "newsletter.consentedAt": new Date(),
          "newsletter.consentSource": "account-preferences",
          "newsletter.consentVersion": "2026-08-18",
          "newsletter.unsubscribedAt": null,
        },
      },
    );
  } else {
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          "newsletter.subscribed": false,
          "newsletter.unsubscribedAt": new Date(),
        },
      },
    );

    // Cancel newsletter messages that have not been sent yet.
    // will update multiple queued newsletter jobs
    await db.collection("newsletterJobs").updateMany(
      {
        // matches only jobs that belong to this user and haven't been sent yet
        userId: user._id,
        status: "pending",
      },
      {
        // every matching pending job is changed to cancelled
        $set: {
          // these jobs are preserved for recordkeepiong but the newsletter will skip them
          status: "cancelled",
        },
      },
    );
  }

  revalidatePath("/account");
}
