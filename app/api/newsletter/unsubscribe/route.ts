import { ObjectId } from "mongodb";

import { verifyUnsubscribeToken } from "@/app/email/unsubscribeToken";
import { getDb } from "@/app/mongodb";

async function unsubscribe(request: Request) {
  // converts the request URL into a URL object and reads its token query param
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return new Response("Invalid unsubscribe link", { status: 400 });
  }

  // seperates the user ID and signature, recreates the expected signature using NEWSLETTER_SECRET
  const userId = verifyUnsubscribeToken(token);

  if (!userId || !ObjectId.isValid(userId)) {
    return new Response("Invalid unsubscribe link", { status: 400 });
  }

  const db = await getDb();
  const objectId = new ObjectId(userId);

  await db.collection("users").updateOne(
    // find the user identified by the ID
    { _id: objectId },

    // update the newsletter settings
    // subscribed becomes fales and unsubscribedAt records when the user unsubscribed
    {
      $set: {
        "newsletter.subscribed": false,
        "newsletter.unsubscribedAt": new Date(),
      },
    },
  );

  // updates every matching queued newsletter job
  await db.collection("newsletterJobs").updateMany(
    // only matches jobs belonging to this user that have not been sent yet
    {
      userId: objectId,
      status: "pending",
    },
    // marks those jobs as cancelled so the newsletter function skips them
    // the email function must be designed to only send jobs whose status is pending
    {
      $set: {
        status: "cancelled",
      },
    },
  );

  return new Response("You have been unsubscribed.", { status: 200 });
}

// Handles unsubscribe links opened normally in a browser.
export async function GET(request: Request) {
  return unsubscribe(request);
}

// Allows the same operation through a POST request, such as submitting a confirmation form.
export async function POST(request: Request) {
  return unsubscribe(request);
}
