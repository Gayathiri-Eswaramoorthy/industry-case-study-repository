async function loginAs(page, email, password, role = "STUDENT") {
  await page.goto("/");
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.click('button[type="submit"]');
}

module.exports = { loginAs };

// HARDENED: Added reusable E2E login helper for role-based journey tests.
