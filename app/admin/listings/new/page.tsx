import { redirect } from "next/navigation";

// responsible for receiving the form data and inserting new listings into MongoDB
import { createListing } from "../actions";

// imports the session helper, reads the JWT stored in the session cookie
import { getSession } from "@/app/auth/session";

export default async function NewListingPage() {
    // reads the session cookie
    const session = await getSession();

    // if it returns null then redirect user to login page
    if (!session) {
        redirect("/login")
    }

    return (
        <main className="mx-auto w-full max-w-3xl px-4 py-10">
            <h1 className="text-3x1 font-bold">Add a listing</h1>

            <form action={createListing} className="mt-8 grid gap-5">
                <Input name="name" label="Listing name"/>
                <Input name="developer" label="Developer"/>
                <Input name="location" label="Location"/>
                <Input name="address" label="Address"/>
                <Input name="type" label="Property type"/>
                <Input name="conStatus" label="Construction status"/>
                <Input name="ceilings" label="Ceiling height"/>
                <Input name="deposit" label="Deposit structure"/>

                <div className="grid gap-5 sm:grid-cols-2">
                    <Input name="price" label="Starting price"/>
                    <Input name="sqft" label="Square feet"/>
                    <Input name="beds" label="Beds"/>
                    <Input name="baths" label="Baths"/>
                    <Input name="garage" label="Garage spaces"/>
                </div>

                <Input name="listStatus" label="Listing status"/>
                <Input name="img" label="Image URL" type="url"/>

                <label className="grid gap-2">
                    <span className="font-semibold">Description</span>
                    <textarea
                        name="disc"
                        required
                        rows={6}
                        className="rounded-lg border border-border bg-surface px-3 py-2"
                    />
                </label>

                <Input
                    name="features"
                    label="Features"
                    placeholder="Pool, Finished basement, Fireplace"
                />

                <Input
                    name="tags"
                    label="Tags"
                    placeholder="Luxury, Downtown, Transit"
                />

                <p className="text-sm text-muted">
                    Seperate features and tags with commas.
                </p>

                <button
                    type="submit"
                    className="rounded-lg bg-accent px-6 py-3 font-semibold text-white"
                >
                    Add Listing
                </button>
            </form>
        </main>
    );
}  

type InputProps = {
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
}

function Input({
    name,
    label,
    type = "text",
    placeholder,
}: InputProps) {
    return (
        <label className="grid gap-2">
            <span className="font-semibold">{label}</span>

            <input
                name={name}
                type={type}
                placeholder={placeholder}
                min={type === "number" ? 0 : undefined}
                required
                className="rouneded-lg border border-border bg-surface px-3 py-2"
            />
        </label>
    );
}