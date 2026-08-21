import { z } from "zod";

// just a format of what the newsletter campaign must look like
export const newsletterCampaignSchema = z.object({
  // these field must be: a string, have the whitespace removed, contain at least one char after trimming
  // and contain no more than a certain number of characters
  // .url() means the inputted field must be a valid absolute URL
  subject: z.string().trim().min(1).max(150),
  heading: z.string().trim().min(1).max(150),
  previewText: z.string().trim().max(200),
  message: z.string().trim().min(1).max(10_000),
  listingUrl: z.string().trim().url(),
  eventDate: z.string().trim().max(100),
  eventAddress: z.string().trim().max(300),
});
