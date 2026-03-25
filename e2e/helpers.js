async function loginAs(page, email, password, role = "STUDENT") {
  await page.goto("/login");
  // TESTFIX: Login page requires selecting a role card before credential fields are rendered.
  const roleLabel =
    role === "ADMIN" ? "Admin" : role === "FACULTY" ? "Faculty" : "Student";
  await page.locator(`div.cursor-pointer:has-text("${roleLabel}")`).first().click();
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

module.exports = { loginAs };

// HARDENED: Added reusable E2E login helper for role-based journey tests.
