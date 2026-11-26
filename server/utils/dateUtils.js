/**
 * generateReference – Creates a readable booking reference like SE-2024-A7K3M
 */
export function generateReference() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  const year = new Date().getFullYear();
  return `SE-${year}-${suffix}`;
}

/**
 * getDatesInRange – Returns array of midnight-UTC Date objects for each night.
 * For checkIn=Jan1, checkOut=Jan3 → [Jan1, Jan2] (2 nights)
 */
export function getDatesInRange(checkIn, checkOut) {
  const dates = [];
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  const current = new Date(start);
  while (current < end) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

/**
 * toMidnightUTC – Normalises a date string to midnight UTC Date object
 */
export function toMidnightUTC(dateStr) {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

