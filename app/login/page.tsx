import { login } from "@/app/auth/actions";
import PasswordInput from "@/app/auth/PasswordInput";
import Link from "next/link";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;

    return (
        <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
            <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-slate-900/5 sm:p-8">
                <div className="mb-8 text-center">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                        Welcome back
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Log in to your account
                    </h1>
                    <p className="mt-3 text-sm text-muted">
                        Access your saved listings and account details.
                    </p>
                </div>

                {error && (
                    <p
                        role="alert"
                        className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                    >
                        {error}
                    </p>
                )}

                <form action={login} className="space-y-5">
                    <label className="block text-sm font-medium text-foreground">
                        Email address
                    <input
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        required
                        className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-3 text-foreground shadow-sm transition placeholder:text-muted focus:border-accent"
                    />
                </label>

                    <label className="block text-sm font-medium text-foreground">
                    Password
                    <PasswordInput
                        autoComplete="off"
                        placeholder="Enter your password"
                    />
                </label>

                    <button
                        type="submit"
                        className="w-full cursor-pointer rounded-lg bg-accent px-4 py-3 font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.99]"
                    >
                        Log in
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-muted">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="font-semibold text-accent hover:underline">
                        Create one
                    </Link>
                </p>
            </section>
        </main>
    );
}
