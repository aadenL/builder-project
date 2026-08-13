import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";

import { logout } from "@/app/auth/actions";
import { getSession } from "@/app/auth/session";
import { getDb } from "@/app/mongodb";

// a server component that checks the session, loads the user from MongoDB, and redirects unauthenticated users to login
/**
 * The complete request flow looks like:
 *  Open /account
    → verify session JWT
    → validate MongoDB user ID
    → find user in MongoDB
    → redirect if invalid
    → otherwise display account information
 */
export default async function AccountPage() {
  // Read and verify the JWT session stored in the session cookie.
  // returns either { userId: "mongodb-object-id" } or null
  const session = await getSession();

  // if there is no valid session or the stored user ID is not a valid MongoDB ObjectId
  if (!session || !ObjectId.isValid(session.userId)) {
    // redirect user to the login page
    redirect("/login");
  }

  // connect to database
  const db = await getDb();

  // gets the users collection from the database
  // searches for the user whose MongoDB _id matches the ID stored in the session
  const user = await db.collection("users").findOne(
    // the _id that was previously turned into a string is converted back to an ObjectID
    // { _id: new ObjectId(session.userId) } is a search filter
    // finds which user's _id equals this value
    { _id: new ObjectId(session.userId) },

    // a projection controls which fields MongoDB returns
    // 1 means include the field, so MongoDB will return the name and email
    // will not return passwordHash because this page doesn't need it
    // MongoDB includes _id by default
    /**
         * It will look like this:
         *  {
            _id: ObjectId(...),
            name: "Alex",
            email: "alex@example.com"
            }
         */
    { projection: { name: 1, email: 1, isAdmin: 1 } },
  );

  // a valid session doesn't mean the user still exists, they could have deleted the account after the session was made
  // if there is no user in the database
  if (!user) {
    // redirect to login page
    redirect("/login");
  }

  // if the session and user are valid, return the protected account interface
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-slate-900/5">
        <div className="border-b border-border bg-accent px-6 py-8 text-white sm:px-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-xl font-bold ring-1 ring-white/30">
            {String(user.name).charAt(0).toUpperCase()}
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
            Account
          </p>
          <h1 className="mt-1 break-words text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome, {user.name}
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Manage your profile and session details.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground">
            Profile information
          </h2>

          <dl className="mt-5 divide-y divide-border rounded-xl border border-border">
            <div className="grid gap-1 px-4 py-4 sm:grid-cols-[9rem_1fr] sm:items-center">
              <dt className="text-sm font-medium text-muted">Name</dt>
              <dd className="font-medium text-foreground">{user.name}</dd>
            </div>
            <div className="grid gap-1 px-4 py-4 sm:grid-cols-[9rem_1fr] sm:items-center">
              <dt className="text-sm font-medium text-muted">Email address</dt>
              <dd className="break-all font-medium text-foreground">
                {user.email}
              </dd>
            </div>
          </dl>

          <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
            {user.isAdmin === true && (
              <>
                <Link
                  href="/admin/listings"
                  className="rounded-lg border border-border px-5 py-2.5 text-center font-semibold"
                >
                  Manage listings
                </Link>

                <Link
                  href="/admin/listings/new"
                  className="rounded-lg bg-accent px-5 py-2.5 text-center font-semibold text-white"
                >
                  Add a listing
                </Link>
              </>
            )}

            {/* Submit the logout Server Action. */}
            <form action={logout} className="w-full sm:w-auto">
              <button
                type="submit"
                className="w-full cursor-pointer rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 active:scale-[0.99]"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
