"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/app/admin/requireAdmin";
import { getNewsletterCollections } from "./collections";
import { newsletterCampaignSchema } from "./validation";

export async function createNewsletterDraft(formData: FormData) {
  // { } is used when a variable is extracting a property from an object
  const { userId } = await requireAdmin();
  const { campaigns } = await getNewsletterCollections();

  // read and validate the submitted form fields
  const result = newsletterCampaignSchema.safeParse({
    subject: formData.get("subject"),
    heading: formData.get("heading"),
    previewText: formData.get("previewText"),
    message: formData.get("message"),
    listingUrl: formData.get("listingUrl"),
    eventDate: formData.get("eventDate"),
    eventAddress: formData.get("eventAddress"),
  });

  if (!result.success) {
    // extract the names of the fields that faild validation
    const invalidFields = [
      // ...new Set(...) removes duplicate errors and converts the set back into an array
      ...new Set(
        // each zod issue has a path that identifies its invalid field
        // if its a nested error path this would join it using a ", "
        // if the error doesn't belong to a specific path then it defaults to "form"
        result.error.issues.map((issue) => issue.path.join(", ") || "form"),
      ),
    ];

    throw new Error(`Invalid newsletter fields: ${invalidFields.join(".")}`);
  }

  // set the current date
  const now = new Date();
  // generate the campaign's MongoDB ID before inserting the doc
  const campaignId = new ObjectId();

  await campaigns.insertOne({
    // set the ID to the generated campaign ID
    _id: campaignId,

    // copy all validated campaign fields into this doc
    ...result.data,

    status: "draft",

    // no recipient jobs have been created or processed yet
    recipientCount: 0,
    sentCount: 0,
    failedCount: 0,
    cancelledCount: 0,

    // record which admin created the newsletter
    createdBy: new ObjectId(userId),

    createdAt: now,
    updatedAt: now,

    // these events have not happened while the campaign is a draft
    queuedAt: null,
    startedAt: null,
    completedAt: null,
  });

  // invalidate cached data on the newsletter admin page
  revalidatePath("/admin/newsletters");

  // open the detail page for the newly created campaign
  redirect(`/admin/newsletters/${campaignId.toString()}`);
}

export async function queueNewsletter(campaignId: string) {
    const { db } = await requireAdmin();
    const { campaigns, jobs } = await getNewsletterCollections();

    if (!ObjectId.isValid(campaignId)) {
        throw new Error("Invalid campaign ID");
    }

    const objectId = new ObjectId(campaignId);

    const campaign = await campaigns.findOne({
        _id: objectId,
        status: "draft",
    });

    if (!campaign) {
        throw new Error("Draft newsletter not found");
    }

    const subs = await db
      .collection("users")
      .find(
        {
            "newsletter.subscribed":true,
            "newsletter.suppressed": { $ne: true },
        },
        {
            projection: {
                name: 1,
                email: 1,
            },
        },
      )
      .toArray();

    const validSubs = subs.filter(
        (
            sub,
        ): sub is typeof sub & {
            name: string;
            email: string;
        } => 
            typeof sub.name === "string" &&
            typeof sub.email === "string",
    );

    if (validSubs.length === 0) {
        throw new Error("There are no active newsletter subs");
    }

    const now = new Date();

    await jobs.insertMany(
      validSubs.map((sub) => ({
        _id: new ObjectId(),
        campaignId: objectId,
        userId: sub._id,
        name: sub.name,
        email: sub.email,
        status: "pending" as const,
        attempts: 0,
        error: null,
        createdAt: now,
        processingStartedAt: null,
        sentAt: null,
        cancelledAt: null,
      })),
      {
        ordered: false,
      },
    );

    await campaigns.updateOne(
        {
            _id: objectId,
            status: "draft",
        },
        {
            $set: {
                status: "queued",
                recipientCount: validSubs.length,
                queuedAt: now,
                updatedAt: now,
            },
        },
    );

    revalidatePath("/admin/newsletters");
    revalidatePath(`/admin/newsletters/${campaignId}`);
}
