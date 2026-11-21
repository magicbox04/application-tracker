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

test("edit an application's details without touching its status", async ({ page }) => {
  const company = `E2E Change ${Date.now()}`;
  const renamed = `${company} Renamed`;
  // Next.js keeps previously visited pages in the DOM (display: none) after
  // client-side navigation. getByRole skips hidden elements, so scoping to
  // the visible <main> keeps lookups on the current page.
  const main = page.getByRole("main");

  // Create one with a location and a deadline
  await page.goto("/");
  await page.getByLabel("Company *").fill(company);
  await page.getByLabel("Role *").fill("Backend Engineer");
  await page.getByLabel("Status", { exact: true }).selectOption("INTERVIEW");
  await page.getByLabel("Location").fill("Busan");
  await page.getByLabel("Deadline").fill("2026-12-15");
  await page.getByRole("button", { name: "Add application" }).click();
  await expect(page.getByRole("status")).toHaveText("Application added.");

  const row = page.getByTestId("application-row").filter({ hasText: company });
  await row.getByRole("link", { name: `${company} — Backend Engineer` }).click();
  await expect(page.getByTestId("status-history")).toBeVisible();
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await expect(page).toHaveURL(/\/edit$/);

  // Form is prefilled and has no status field
  await expect(main.getByRole("heading", { name: /^Edit / })).toBeVisible();
  await expect(main.getByLabel("Company *")).toHaveValue(company);
  await expect(main.getByLabel("Location")).toHaveValue("Busan");
  await expect(main.getByLabel("Deadline")).toHaveValue("2026-12-15");
  await expect(main.getByLabel("Status", { exact: true })).toHaveCount(0);

  // A validation error keeps the edits on screen
  await main.getByLabel("Company *").fill(renamed);
  await main.getByLabel("Job posting URL").fill("ftp://bad.example");
  await main.getByRole("button", { name: "Save changes" }).click();
  await expect(main.getByRole("status")).toHaveText("Please fix the highlighted fields.");
  await expect(main.getByLabel("Company *")).toHaveValue(renamed);

  // Fix it, clear the location, add notes, save
  await main.getByLabel("Job posting URL").fill("https://jobs.example/42");
  await main.getByLabel("Location").fill("");
  await main.getByLabel("Notes").fill("Recruiter: Park");
  await main.getByRole("button", { name: "Save changes" }).click();

  // Back on the detail page with the new values
  const label = `${renamed} — Backend Engineer`;
  await expect(main.getByRole("heading", { name: label })).toBeVisible();
  await expect(main.getByRole("link", { name: "https://jobs.example/42" })).toBeVisible();
  const details = main.locator("dl");
  await expect(details).toContainText("Recruiter: Park");
  await expect(details).not.toContainText("Busan");
  await expect(details).toContainText("2026-12-15");

  // Status and history are untouched
  await expect(main.getByTestId("status-badge")).toHaveText("Interview");
  const history = main.getByTestId("status-history").locator("li");
  await expect(history).toHaveCount(1);
  await expect(history.first()).toContainText("Added as Interview");

  // Clean up
  page.once("dialog", (dialog) => dialog.accept());
  await main.getByRole("button", { name: `Delete ${label}` }).click();
  await expect(page).toHaveURL("/");
});

test("undo a mistaken status change, one step at a time", async ({ page }) => {
  const company = `E2E Undo ${Date.now()}`;
  const label = `${company} — Designer`;
  const main = page.getByRole("main");

  await page.goto("/");
  await main.getByLabel("Company *").fill(company);
  await main.getByLabel("Role *").fill("Designer");
  await main.getByRole("button", { name: "Add application" }).click();
  await expect(main.getByRole("status")).toHaveText("Application added.");
  await main.getByRole("link", { name: label }).click();
  await expect(main.getByRole("heading", { name: label })).toBeVisible();

  const badge = main.getByTestId("status-badge");
  const history = main.getByTestId("status-history").locator("li");
  const undo = main.getByRole("button", { name: /^Undo last change/ });

  // Nothing to undo right after creation
  await expect(undo).toHaveCount(0);

  // APPLIED -> INTERVIEW -> REJECTED (the "mistake")
  await main.getByLabel("New status").selectOption("INTERVIEW");
  await main.getByRole("button", { name: "Update" }).click();
  await expect(badge).toHaveText("Interview");
  await main.getByLabel("New status").selectOption("REJECTED");
  await main.getByRole("button", { name: "Update" }).click();
  await expect(badge).toHaveText("Rejected");
  await expect(history).toHaveCount(3);

  // Undo -> back to Interview, and the event is gone from history
  page.once("dialog", (dialog) => dialog.accept());
  await expect(undo).toHaveText("Undo last change (Interview → Rejected)");
  await undo.click();
  await expect(badge).toHaveText("Interview");
  await expect(history).toHaveCount(2);
  await expect(main.getByLabel("New status")).toBeVisible();

  // Dismissing the confirm dialog changes nothing
  page.once("dialog", (dialog) => dialog.dismiss());
  await undo.click();
  await expect(badge).toHaveText("Interview");
  await expect(history).toHaveCount(2);

  // Undo again -> back to Applied; creation event can't be undone
  page.once("dialog", (dialog) => dialog.accept());
  await undo.click();
  await expect(badge).toHaveText("Applied");
  await expect(history).toHaveCount(1);
  await expect(undo).toHaveCount(0);

  // Clean up
  page.once("dialog", (dialog) => dialog.accept());
  await main.getByRole("button", { name: `Delete ${label}` }).click();
  await expect(page).toHaveURL("/");
});

test("edit page for an unknown id shows the not-found page", async ({ page }) => {
  await page.goto("/applications/00000000-0000-4000-8000-000000000000/edit");
  await expect(page.getByText("This page could not be found.")).toBeVisible();
});

test("unknown application id shows the not-found page", async ({ page }) => {
  // The page streams (loading.tsx), so notFound() runs after the 200 status is
  // sent. Next.js renders the not-found UI and adds noindex instead.
  await page.goto("/applications/00000000-0000-4000-8000-000000000000");
  await expect(page.getByText("This page could not be found.")).toBeVisible();
  await expect(page.locator('meta[name="robots"][content="noindex"]').first()).toBeAttached();
});
