// Live migration runner – runs with: node server/scripts/liveMigration.mjs
import { runMigration } from "./migrateFromJson.js";

runMigration({ dryRun: false })
  .then((summary) => {
    const hasErr = ["users", "hotels", "bookings", "feedbacks"].some(
      (c) => (summary[c].failed || 0) > 0
    );
    process.exit(hasErr ? 1 : 0);
  })
  .catch((err) => {
    console.error("❌ Fatal:", err.message || err);
    process.exit(1);
  });
