import PricingRule from "../models/PricingRule.js";
import { getDatesInRange } from "../utils/dateUtils.js";

/**
 * Calculate the server-side price for a room booking.
 * NEVER trust client-sent prices.
 *
 * @param {Object} room – Mongoose Room document
 * @param {Date|string} checkIn
 * @param {Date|string} checkOut
 * @param {number} roomCount – number of rooms requested
 * @param {number} pointsToRedeem – loyalty points to redeem (1 point = ₹0.50)
 * @param {Object|null} coupon – validated Coupon document
 * @returns {Object} Full price breakdown (all amounts in RUPEES)
 */
export async function calculatePrice(room, checkIn, checkOut, roomCount = 1, pointsToRedeem = 0, coupon = null) {
  const basePrice = room.basePrice;
  const dates = getDatesInRange(checkIn, checkOut);
  const nights = dates.length;

  if (nights < 1) throw new Error("Check-out must be after check-in.");

  // Fetch active pricing rules for this room
  const rules = await PricingRule.find({
    roomId: room._id,
    isActive: true,
  }).sort({ priority: -1 });

  // Calculate price for each night
  let baseAmount = 0;
  let weekendSurcharge = 0;
  let seasonalSurcharge = 0;

  for (const date of dates) {
    const dayOfWeek = date.getUTCDay(); // 0=Sun, 6=Sat
    let nightPrice = basePrice;

    // Apply applicable rules in priority order
    for (const rule of rules) {
      let applies = false;

      if (rule.type === "weekend") {
        applies = rule.daysOfWeek?.includes(dayOfWeek);
      } else if (rule.type === "seasonal" || rule.type === "special_event") {
        const ruleStart = rule.startDate ? new Date(rule.startDate) : null;
        const ruleEnd = rule.endDate ? new Date(rule.endDate) : null;
        applies = ruleStart && ruleEnd && date >= ruleStart && date <= ruleEnd;
      } else if (rule.type === "length_of_stay") {
        applies = nights >= (rule.minNights || 1);
      }

      if (applies) {
        const modifier =
          rule.modifierType === "percent"
            ? (basePrice * rule.priceModifier) / 100
            : rule.priceModifier;

        if (rule.type === "weekend") weekendSurcharge += modifier;
        else seasonalSurcharge += modifier;

        nightPrice += modifier;
      }
    }

    baseAmount += nightPrice;
  }

  baseAmount = Math.round(baseAmount * roomCount);

  // Coupon discount
  let couponDiscount = 0;
  if (coupon && coupon.isActive) {
    if (coupon.discountType === "percent") {
      couponDiscount = Math.round((baseAmount * coupon.discountValue) / 100);
      if (coupon.maxDiscount) couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
    } else {
      couponDiscount = coupon.discountValue;
    }
    couponDiscount = Math.min(couponDiscount, baseAmount);
  }

  // Loyalty points discount (1 point = ₹0.50, max 20% of baseAmount)
  const maxPointsRedeemable = Math.min(pointsToRedeem, Math.floor(baseAmount * 0.2 / 0.5));
  const pointsDiscount = Math.round(maxPointsRedeemable * 0.5);

  const afterDiscounts = Math.max(0, baseAmount - couponDiscount - pointsDiscount);

  // GST (18%)
  const taxes = Math.round(afterDiscounts * 0.18);
  const totalAmount = afterDiscounts + taxes;

  // Points earned on this booking (1 point per ₹100 spent)
  const pointsEarned = Math.floor(totalAmount / 100);

  return {
    nights,
    roomCount,
    baseAmount,                                        // before discounts
    weekendSurcharge: Math.round(weekendSurcharge * roomCount),
    seasonalSurcharge: Math.round(seasonalSurcharge * roomCount),
    couponDiscount,
    pointsDiscount,
    pointsRedeemed: maxPointsRedeemable,
    taxes,
    totalAmount,                                       // in RUPEES
    totalAmountPaise: totalAmount * 100,               // for Razorpay
    pointsEarned,
  };
}

