export interface LiveMapProps {
  pickupArea: string;
  deliveryArea: string;
  pickupLabel: string;
  deliveryLabel: string;
  stopAreas?: string[];
  stopLabels?: string[];
  inTransit?: boolean;
}
