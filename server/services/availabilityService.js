import InventoryDay from "../models/InventoryDay.js";
import Room from "../models/Room.js";
import { getDatesInRange, toMidnightUTC } from "../utils/dateUtils.js";


export async function checkAvailability(roomId, checkIn, checkOut, requestedRooms = 1) {
  const room = await Room.findById(roomId);
  if (!room || !room.isActive) {
    return { available: false, reason: "Room not found or inactive" };
  }

  const dates = getDatesInRange(checkIn, checkOut);
  if (dates.length === 0) {
    return { available: false, reason: "Invalid date range" };
  }

  const inventoryDocs = await InventoryDay.find({
    roomId,
    date: { $in: dates },
  });

  const docMap = {};
  for (const doc of inventoryDocs) {
    const key = doc.date.toISOString().split("T")[0];
    docMap[key] = doc.available;
  }

  // For dates with no InventoryDay doc → assume full inventory
  const totalInventory = room.totalInventory;
  let minAvailable = totalInventory;
  const dateMap = {};

  for (const date of dates) {
    const key = date.toISOString().split("T")[0];
    const avail = docMap[key] !== undefined ? docMap[key] : totalInventory;
    dateMap[key] = avail;
    minAvailable = Math.min(minAvailable, avail);
  }

  return {
    available: minAvailable >= requestedRooms,
    minAvailable,
    totalInventory,
    dateMap,
    dates: dates.map((d) => d.toISOString().split("T")[0]),
  };
}


export async function decrementInventory(roomId, hotelId, dates, rooms, session, totalInventory) {
  for (const date of dates) {
    const result = await InventoryDay.findOneAndUpdate(
      {
        roomId,
        date,
        $expr: { $gte: ["$available", rooms] }, // only if enough available
        blocked: false,
      },
      { $inc: { available: -rooms } },
      { new: true, session, upsert: false }
    );

    if (!result) {
      // Try upsert for dates with no existing doc (first booking for that date)
      // available starts at totalInventory - rooms
      const upserted = await InventoryDay.findOneAndUpdate(
        { roomId, date },
        {
          $setOnInsert: { roomId, hotelId, date, available: totalInventory - rooms, blocked: false },
        },
        { new: true, session, upsert: true }
      );

      // If upsert fails (doc existed but available < rooms), abort
      if (!upserted || upserted.available < 0) {
        return { success: false, failedDate: date.toISOString().split("T")[0] };
      }
    }
  }
  return { success: true };
}

/**
 * Restore inventory (on hold expiry or booking cancellation).
 */
export async function restoreInventory(roomId, dates, rooms, session) {
  for (const date of dates) {
    await InventoryDay.findOneAndUpdate(
      { roomId, date },
      { $inc: { available: rooms } },
      { session, upsert: false }
    );
  }
}

/**
 * Get monthly availability calendar for a room (for calendar UI).
 */
export async function getMonthlyAvailability(roomId, year, month) {
  const room = await Room.findById(roomId);
  if (!room) return null;

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0)); // last day of month

  const docs = await InventoryDay.find({
    roomId,
    date: { $gte: startDate, $lte: endDate },
  });

  const docMap = {};
  for (const doc of docs) {
    docMap[doc.date.toISOString().split("T")[0]] = {
      available: doc.available,
      blocked: doc.blocked,
    };
  }

  const calendar = {};
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = current.toISOString().split("T")[0];
    calendar[key] = docMap[key] || { available: room.totalInventory, blocked: false };
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return { roomId, year, month, totalInventory: room.totalInventory, calendar };
}

