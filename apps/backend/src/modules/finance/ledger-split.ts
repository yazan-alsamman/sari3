/** ADR-013. driver base is round(T * 0.75). Platform is the remainder so the two shares equal T. */
export function splitDeliveryCharge(totalAmount: number, bonus = 0): {
  driverBase: number;
  platformShare: number;
  bonus: number;
  driverEarning: number;
} {
  const driverBase = Math.round(totalAmount * 0.75);
  const platformShare = totalAmount - driverBase;
  return {
    driverBase,
    platformShare,
    bonus,
    driverEarning: driverBase + bonus,
  };
}
