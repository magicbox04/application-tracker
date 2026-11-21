import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationForm } from "@/components/application-form";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { getApplication } from "@/lib/db/queries";
import { applicationIdSchema } from "@/lib/validation/application";

export default async function EditApplicationPage({
  params,
}: PageProps<"/applications/[id]/edit">) {
  const { id } = await params;
  if (!applicationIdSchema.safeParse({ applicationId: id }).success) notFound();

  const userId = await getCurrentUserId();
  const app = await getApplication(userId, id);
  if (!app) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Link href={`/applications/${app.id}`} className="text-sm text-zinc-500 hover:underline">
        ← Back to application
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">
        Edit {app.company} — {app.role}
      </h1>
      <p className="text-sm text-zinc-500">
        Status is changed from the application page, so every change is checked
        and recorded in its history.
      </p>
      <ApplicationForm
        mode="edit"
        applicationId={app.id}
        initialValues={{
          company: app.company,
          role: app.role,
          url: app.url ?? "",
          location: app.location ?? "",
          appliedAt: app.appliedAt ?? "",
          deadline: app.deadline ?? "",
          notes: app.notes ?? "",
        }}
      />
    </main>
  );
}
