import { expect, type Page, test } from "@playwright/test";

// Stats cover all of the dev user's data, so this test checks how the numbers
// change when it adds an application, not absolute values.

async function appliedCount(page: Page): Promise<number> {
  await page.goto("/stats");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Stats" })).toBeVisible();
  const empty = main.getByText("No applications yet.");
  const funnel = main.getByRole("list", { name: "Pipeline funnel" });
  await expect(empty.or(funnel)).toBeVisible();
  if (await empty.isVisible()) return 0;
  const label = await funnel.getByRole("listitem").first().getAttribute("aria-label");
  const match = label?.match(/^Applied: (\d+)/);
  if (!match?.[1]) throw new Error(`Unexpected funnel label: ${label}`);
  return Number(match[1]);
}

test("stats reflect a new application moving through the pipeline", async ({ page }) => {
  const company = `E2E Stats ${Date.now()}`;
  const label = `${company} — Analyst`;
  const main = page.getByRole("main");
  const before = await appliedCount(page);

  // Add an application and move it to Interview
  await page.goto("/");
  await main.getByLabel("Company *").fill(company);
  await main.getByLabel("Role *").fill("Analyst");
  await main.getByRole("button", { name: "Add application" }).click();
  await expect(main.getByRole("status")).toHaveText("Application added.");
  const row = main.getByTestId("application-row").filter({ hasText: company });
  await row.getByLabel("New status").selectOption("INTERVIEW");
  await row.getByRole("button", { name: "Update" }).click();
  await expect(row.getByTestId("status-badge")).toHaveText("Interview");

  // The funnel's Applied count went up by one, and the page renders its sections
  expect(await appliedCount(page)).toBe(before + 1);
  await expect(main.getByText("Response rate")).toBeVisible();
  await expect(main.getByRole("heading", { name: "Current status" })).toBeVisible();

  // Nav marks Stats as the current page
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Stats" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  // Clean up through the UI
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await main.getByRole("button", { name: `Delete ${label}` }).click();
  await expect(main.getByTestId("application-row").filter({ hasText: company })).toHaveCount(0);
});
