import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";
import ListingFormPreview from "@/app/admin/listings/ListingFormPreview";

// imports the session helper, reads the JWT stored in the session cookie
import { getSession } from "@/app/auth/session";
import { getDb } from "@/app/mongodb";

import MultiValueField from "@/app/admin/listings/new/MultiValueField";

import ImageUpload from "@/app/admin/listings/new/imageUpload";

// new listing page
export default async function NewListingPage() {
  // read the JWT stored in the session cookie
  const session = await getSession();

  // if the session doesn't exist or the stored user ID is invalid
  if (!session || !ObjectId.isValid(session.userId)) {
    // redirect the user to login
    redirect("/login");
  }

  // connect to the database
  const db = await getDb();

  const [existingFeatures, existingTags] = await Promise.all([
    db.collection("builders").distinct("features"),
    db.collection("builders").distinct("tags"),
  ]);

  // pull the users collection from MongoDB and search for the logged-in user
  const user = await db.collection("users").findOne(
    // convert the string userId back into a MongoDB ObjectId
    { _id: new ObjectId(session.userId) },

    // projection tells MongoDB to return only the isAdmin field
    { projection: { isAdmin: 1 } },
  );

  // if the user does not have isAdmin set to the Boolean value true
  if (user?.isAdmin !== true) {
    // redirect them to the homepage so they cannot view the form
    redirect("/");
  }

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:py-14">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/account"
          className="text-sm font-semibold text-accent transition hover:opacity-75"
        >
          ← Back to account
        </Link>

        <header className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Add a new listing
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Enter the development details below. Required information is marked
            with an asterisk.
          </p>
        </header>

        {/* Submitting this form calls the createListing Server Action. */}
        <ListingFormPreview>
          {/* General information used to identify the development. */}
          <FormSection
            title="Development details"
            description="The main information buyers will use to identify this project."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Input name="name" label="Listing name" />
              <Input name="developer" label="Developer" />
              <Input name="location" label="Location" />
              <Input name="address" label="Address" />
              <Input name="type" label="Property type" />

              {/* Limits construction status to the three supported choices. */}
              <label className="grid gap-2 text-sm font-semibold text-foreground">
                <span>
                  Construction status <RequiredMark />
                </span>
                <select
                  name="conStatus"
                  defaultValue=""
                  required
                  className="cursor-pointer rounded-lg border border-border bg-background px-3 py-2.5 font-normal text-foreground"
                >
                  {/* The empty option makes the admin actively choose a status. */}
                  <option value="" disabled>
                    Select construction status
                  </option>
                  <option value="Pre-construction">Pre-construction</option>
                  <option value="Under construction">Under construction</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>
            </div>
          </FormSection>

          {/* Number inputs make sure prices and property measurements are sent as numbers. */}
          <FormSection
            title="Pricing and specifications"
            description="Add the starting price and typical unit details."
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Input name="price" label="Starting price" type="number" />
              <Input name="sqft" label="Square feet" type="number" />
              <Input name="beds" label="Bedrooms" type="number" />
              <Input name="baths" label="Bathrooms" type="number" />
              <Input name="garage" label="Garage spaces" type="number" />
              <Input name="ceilings" label="Ceiling height" />
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Input name="deposit" label="Deposit structure" />
              <Input name="listStatus" label="Listing status" />
            </div>
          </FormSection>

          {/* Content displayed on the listing card and details page. */}
          <FormSection
            title="Listing content"
            description="Describe the project and include the image shown on its card."
          >
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              <span>
                Description <RequiredMark />
              </span>
              <textarea
                name="desc"
                required
                rows={7}
                placeholder="Describe the development, neighbourhood, amenities, and key selling points."
                className="resize-y rounded-lg border border-border bg-background px-3 py-2.5 font-normal text-foreground placeholder:text-muted/70"
              />
            </label>

            <div className="mt-5">
              <ImageUpload />
            </div>

            {/* The Server Action separates these comma-separated values into arrays. */}
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <MultiValueField
                name="features"
                label="Features"
                options={existingFeatures}
              />

              <MultiValueField
                name="tags"
                label="Tags"
                options={existingTags}
              />
            </div>
            <p className="mt-3 text-sm text-muted">
              You can choose multiple existing options or add new ones.
            </p>
          </FormSection>
        </ListingFormPreview>
      </div>
    </main>
  );
}

// reusable wrapper that keeps every group of fields styled the same way
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
      <div className="mb-6 border-b border-border pb-5">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

// describes the values that can be passed into the reusable Input component
type InputProps = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
};

// reusable input so every form field has the same label, spacing, and styling
function Input({
  name,
  label,
  type = "text",
  placeholder,
  required = true,
}: InputProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-foreground">
      <span>
        {label} {required && <RequiredMark />}
      </span>
      {/* Number fields cannot accept values below zero. */}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "any" : undefined}
        required={required}
        className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal text-foreground placeholder:text-muted/70"
      />
    </label>
  );
}

// displays an asterisk beside every required field without making a screen reader repeat it
function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-accent">
      *
    </span>
  );
}
