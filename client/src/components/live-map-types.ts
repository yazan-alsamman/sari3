export interface LiveMapProps {
  pickupArea: string;
  deliveryArea: string;
  pickupLabel: string;
  deliveryLabel: string;
  stopAreas?: string[];
  stopLabels?: string[];
  inTransit?: boolean;
  driverPoint?: { latitude: number; longitude: number; freshness: string };
}
