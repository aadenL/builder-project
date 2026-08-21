import type { ObjectId } from "mongodb";

// creating a string union, a campaign status can only be one of these values
export type NewsletterCampaignStatus =
  "draft" | "queued" | "sending" | "completed" | "failed" | "cancelled";

// creating a string union, a job status can only be one of these values
export type NewsletterJobStatus =
  "pending" | "processing" | "sent" | "failed" | "cancelled";

/**
 * a Campaign is the complete newsletter you want to send
 * a Job is the task of sending that newsletter to one specific person
 * if you had a newsletter with 500 subs, you would have 1 campaign and 500 jobs
 */
export type NewsletterCampaign = {
  _id: ObjectId;

  // email subject line
  subject: string;
  // main email heading
  heading: string;
  // main newsletter content
  message: string;
  // show text that email clients may display next to / underneath the subject before the email is opened
  previewText: string;
  // a URL to the property listing promoted by the campaign
  listingUrl: string;
  // info about an associated event or property viewing
  eventDate: string | null;
  eventAddress: string | null;

  // restricts the campaign to one of the previously defined status values
  status: NewsletterCampaignStatus;
  // total number of recipient jobs created for the campaign
  recipientCount: number;
  // stores how many jobs reached final state
  // these counts let the admin page show campaign progress w/o recounting every job every time
  sentCount: number;
  failedCount: number;
  cancelledCount: number;

  // ID of the admin who created the campaign
  createdBy: ObjectId;
  // when the campaign was first created and when it was most recently updated/changed
  createdAt: Date;
  updatedAt: Date;
  // all of these dates are initially null because the events may not have happened yet
  // queuedAt is when the campaign entered the queue
  queuedAt: Date | null;
  // startedAt is when the sending of the newsletter started
  startedAt: Date | null;
  // complementedAt is when the processing of the newsletter job is finished
  completedAt: Date | null;
};

export type NewsletterJob = {
  _id: ObjectId;

  // connects the job to its campaign (i.e: the subscribed user to the newsletter)
  campaignId: ObjectId;
  // connects the job to the recipient's user account
  userId: ObjectId;

  // store the recipients email and name
  email: string;
  name: string;

  // tracks the job's current processing state
  status: NewsletterJobStatus;
  // track how many times the email was attempted to be sent
  attempts: number;
  // stores the most recent error message, if there is no error message it defaults to null
  error: string | null;

  // when the job was created
  createdAt: Date;
  // records when you started processing the job
  processingStartedAt: Date | null;
  // records when the email was properly sent
  sentAt: Date | null;

  // stores the date the recipient chooses to unsubscribe from the newsletter, otherwise it defaults to null
  cancelledAt: Date | null;
};
