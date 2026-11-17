import { expect, test } from "@playwright/test";

// Needs a running local Postgres with the schema pushed (see README).
test("add an application, move it through the pipeline, then delete it", async ({
  page,
}) => {
  const company = `E2E Co ${Date.now()}`;
  const role = "QA Engineer";
  const label = `${company} — ${role}`;

  await page.goto("/");

  // Add
  await page.getByLabel("Company *").fill(company);
  await page.getByLabel("Role *").fill(role);
  await page.getByLabel("Status", { exact: true }).selectOption("APPLIED");
  await page.getByLabel("Deadline").fill("2026-12-31");
  await page.getByRole("button", { name: "Add application" }).click();
  await expect(page.getByRole("status")).toHaveText("Application added.");

  const row = page.getByTestId("application-row").filter({ hasText: company });
  // Assert on the badge: the row also contains the dropdown's option labels.
  const badge = row.getByTestId("status-badge");
  await expect(badge).toHaveText("Applied");
  await expect(row).toContainText("Deadline 2026-12-31");
  // Form cleared after a successful add.
  await expect(page.getByLabel("Company *")).toHaveValue("");

  // Only reachable statuses are offered: APPLIED can't jump to OFFER.
  const select = row.getByLabel("New status");
  await expect(select.locator("option[value=OFFER]")).toHaveCount(0);

  // APPLIED -> INTERVIEW
  await select.selectOption("INTERVIEW");
  await row.getByRole("button", { name: "Update" }).click();
  await expect(badge).toHaveText("Interview");

  // INTERVIEW -> REJECTED (final)
  await row.getByLabel("New status").selectOption("REJECTED");
  await row.getByRole("button", { name: "Update" }).click();
  await expect(badge).toHaveText("Rejected");
  await expect(row.getByLabel("New status")).toHaveCount(0);
  await expect(row).toContainText("Final");

  // Detail page shows the full history
  await row.getByRole("link", { name: label }).click();
  await expect(page.getByRole("heading", { name: label })).toBeVisible();
  const history = page.getByTestId("status-history").locator("li");
  await expect(history).toHaveCount(3);
  await expect(history.nth(0)).toContainText("Added as Applied");
  await expect(history.nth(1)).toContainText("Applied → Interview");
  await expect(history.nth(2)).toContainText("Interview → Rejected");

  // Delete (accept the confirm dialog) and land back on the list
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: `Delete ${label}` }).click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByTestId("application-row").filter({ hasText: company }),
  ).toHaveCount(0);
});

test("shows validation errors and keeps what was typed", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Company *").fill("Acme");
  await page.getByLabel("Role *").fill("Dev");
  // type=url lets this through in the browser only if it parses; use a
  // non-http scheme, which the browser accepts but the server rejects.
  await page.getByLabel("Job posting URL").fill("ftp://acme.example/job");
  await page.getByRole("button", { name: "Add application" }).click();

  await expect(page.getByRole("status")).toHaveText("Please fix the highlighted fields.");
  await expect(page.getByLabel("Company *")).toHaveValue("Acme");
  await expect(page.getByLabel("Job posting URL")).toHaveValue("ftp://acme.example/job");
});

test("unknown application id shows the not-found page", async ({ page }) => {
  // The page streams (loading.tsx), so notFound() runs after the 200 status is
  // sent. Next.js renders the not-found UI and adds noindex instead.
  await page.goto("/applications/00000000-0000-4000-8000-000000000000");
  await expect(page.getByText("This page could not be found.")).toBeVisible();
  await expect(page.locator('meta[name="robots"][content="noindex"]').first()).toBeAttached();
});
