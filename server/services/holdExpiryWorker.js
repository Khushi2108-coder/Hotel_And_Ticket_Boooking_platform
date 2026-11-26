import cron from "node-cron";
import mongoose from "mongoose";
import BookingHold from "../models/BookingHold.js";
import InventoryDay from "../models/InventoryDay.js";
import { getDatesInRange } from "../utils/dateUtils.js";

/**
 * Hold Expiry Worker
 * Runs every minute. Finds expired active holds and:
 *  1. Restores inventory for each date in the hold range (atomic $inc)
 *  2. Marks hold as 'expired'
 * All within a MongoDB transaction for safety.
 */
export function startHoldExpiryWorker() {
  console.log("⏰ Hold expiry worker started (runs every minute)");

  cron.schedule("* * * * *", async () => {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const expiredHolds = await BookingHold.find({
        status: "active",
        expiresAt: { $lte: new Date() },
      })
        .limit(50) // process up to 50 per tick to avoid long transactions
        .session(session);

      if (expiredHolds.length === 0) {
        await session.abortTransaction();
        return;
      }

      for (const hold of expiredHolds) {
        const dates = getDatesInRange(hold.checkIn, hold.checkOut);

        // Restore inventory for each night
        for (const date of dates) {
          await InventoryDay.findOneAndUpdate(
            { roomId: hold.roomId, date },
            { $inc: { available: hold.rooms } },
            { session }
          );
        }

        // Mark hold as expired
        hold.status = "expired";
        await hold.save({ session });
      }

      await session.commitTransaction();
      console.log(`⏰ Hold expiry: processed ${expiredHolds.length} expired hold(s)`);
    } catch (err) {
      await session.abortTransaction();
      console.error("Hold expiry worker error:", err.message);
    } finally {
      session.endSession();
    }
  });
}

