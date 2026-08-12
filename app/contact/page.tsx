import Link from "next/link";
import { Mail, Phone } from "lucide-react";

export const metadata = {
  title: "Contact | Preconstruction Listings",
  description: "Contact us about a property",
};

export default function ContactPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border bg-accent px-6 py-8 text-white sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
            Get in touch
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">Contact us</h1>
        </div>

        <div className="grid gap-4 p-6 sm:p-8">
          <a
            href="mailto:YOUR-EMAIL@example.com"
            className="flex items-center gap-4 rounded-xl border border-border p-4 transition hover:border-accent hover:text-accent"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Mail size={20} aria-hidden="true" />
            </span>

            <span>
              <span className="block text-sm font-semibold">Email</span>

              <span className="block text-sm text-muted">
                jenyau888@gmail.com
              </span>
            </span>
          </a>

          <div className="mt-2 flex justify-end">
            <Link
              href="/"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Return to listings
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
