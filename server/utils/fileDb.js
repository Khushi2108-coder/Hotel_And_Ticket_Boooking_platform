/**
 * fileDb.js — RETIRED
 *
 * This JSON file-database has been retired. StayEase now uses MongoDB Atlas exclusively.
 * All data was migrated to MongoDB Atlas (database: stayease) on 2026-11-25.
 *
 * Archive: server/archive/legacy-runtime/fileDb.js.archived
 * Data archive: server/archive/legacy-data/
 *
 * If you see this error at runtime, an old import was not updated.
 * Check: controllers/, repositories/ — all should import from Mongoose models directly.
 */

export const db = new Proxy(
  {},
  {
    get(_, method) {
      return () => {
        throw new Error(
          `[StayEase] fileDb.js is RETIRED. ` +
            `The method db.${String(method)}() was called but JSON database is no longer active. ` +
            `All data lives in MongoDB Atlas. Update the calling code to use Mongoose models.`
        );
      };
    },
  }
);

export default db;
