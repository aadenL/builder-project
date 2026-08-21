import { createNewsletterDraft } from "@/app/api/newsletter/actions";
import { requireAdmin } from "../../requireAdmin";

export default async function NewNewsletterPage() {
  await requireAdmin();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Create newsletter</h1>

      <form action={createNewsletterDraft} className="mt-8 space-y-6">
        <label className="grid gap-2 font-semibold">
          Subject
          <input
            name="subject"
            required
            maxLength={150}
            className="rounded-lg border border-border bg-background px-3 py-2.5"
          />
        </label>

        <label className="grid gap-2 font-semibold">
          Preview text
          <input
            name="previewText"
            maxLength={200}
            className="rounded-lg border border-border bg-background px-3 py-2.5"
          />
        </label>

        <label className="grid gap-2 font-semibold">
          Heading
          <input
            name="heading"
            required
            maxLength={150}
            className="rounded-lg border border-border bg-background px-3 py-2.5"
          />
        </label>

        <label className="grid gap-2 font-semibold">
          Message
          <textarea
            name="message"
            required
            rows={10}
            maxLength={10_000}
            className="rounded-lg border border-border bg-background px-3 py-2.5"
          />
        </label>

        <label className="grid gap-2 font-semibold">
          Listing URL
          <input
            name="listingUrl"
            type="url"
            required
            placeholder="https://your-site.vercel.app/builders/..."
            className="rounded-lg border border-border bg-background px-3 py-2.5"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 font-semibold">
            Event date
            <input
              name="eventDate"
              placeholder="Saturday, September 12 from 12–4 PM"
              className="rounded-lg border border-border bg-background px-3 py-2.5"
            />
          </label>

          <label className="grid gap-2 font-semibold">
            Event address
            <input
              name="eventAddress"
              className="rounded-lg border border-border bg-background px-3 py-2.5"
            />
          </label>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-accent px-6 py-3 font-semibold text-white"
        >
          Save draft
        </button>
      </form>
    </main>
  );
}
