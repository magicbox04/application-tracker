import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Job Application Tracker");
  await expect(
    page.getByRole("heading", { name: "Job Application Tracker" }),
  ).toBeVisible();
});
