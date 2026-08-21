import "server-only";

import { getDb } from "@/app/mongodb";

import type {
  NewsletterCampaign,
  NewsletterJob,
} from "@/app/api/newsletter/types";

// collection helper
export async function getNewsletterCollections() {
  const db = await getDb();

  return {
    // retrieves the MongoDB collection named newsletterCampaigns
    campaigns: db.collection<NewsletterCampaign>("newsletterCampaigns"),
    // retrieves the MongoDB collection named newsletterJobs
    jobs: db.collection<NewsletterJob>("newsletterJobs"),
  };
}
