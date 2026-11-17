import { Suspense } from "react";
import { ApplicationList } from "@/components/application-list";
import { NewApplicationForm } from "@/components/new-application-form";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          Job Application Tracker
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Track every application from wishlist to offer.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">New application</h2>
        <NewApplicationForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Applications</h2>
        <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
          <ApplicationList />
        </Suspense>
      </section>
    </main>
  );
}
