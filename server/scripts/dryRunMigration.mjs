// Dry-run wrapper – runs with: node server/scripts/dryRunMigration.mjs
import { runMigration } from "./migrateFromJson.js";

runMigration({ dryRun: true })
  .then((summary) => {
    const hasErr = ["users", "hotels", "bookings", "feedbacks"].some(
      (c) => (summary[c].failed || 0) > 0
    );
    if (hasErr) {
      console.error("\n❌ DRY-RUN found validation errors. Fix before live migration.");
      process.exit(1);
    } else {
      console.log("✅ DRY-RUN passed. Safe to proceed with live migration.");
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error("❌ Fatal:", err.message || err);
    process.exit(1);
  });
