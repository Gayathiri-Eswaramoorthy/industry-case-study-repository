const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  retries: 0,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    trace: "on-first-retry",
  },
  webServer: [
    {
      // TESTFIX: Boot backend with test classpath + seeded H2 data so E2E role accounts and faculty list exist.
      command:
        "cmd /c \"set JWT_SECRET=ThisIsATestJwtSecretKeyAtLeast32Chars&& set DB_URL=jdbc:h2:mem:e2edb;DB_CLOSE_DELAY=-1&& set DB_USER=sa&& set DB_PASSWORD=&& set SPRING_JPA_HIBERNATE_DDL_AUTO=create-drop&& set SPRING_JPA_DEFER_DATASOURCE_INITIALIZATION=true&& set SPRING_SQL_INIT_MODE=always&& set SPRING_SQL_INIT_DATA_LOCATIONS=file:./e2e-seed.sql&& .\\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=test -Dspring-boot.run.useTestClasspath=true\"",
      cwd: "./backend",
      // TESTFIX: Use a stable API readiness URL instead of Swagger docs endpoint (which can return 500).
      url: "http://localhost:8080/api/cases",
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
    },
    {
      // TESTFIX: Start frontend dev server automatically to prevent ERR_CONNECTION_REFUSED on localhost:5173.
      // TESTFIX: Ensure frontend points to the Playwright-managed backend instance.
      command: "cmd /c \"set VITE_API_BASE_URL=http://localhost:8080/api&& npm run dev --prefix frontend\"",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});

// HARDENED: Added root Playwright config for critical cross-role journey E2E coverage.
