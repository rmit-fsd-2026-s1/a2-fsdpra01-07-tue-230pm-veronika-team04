export type VenueStatus = "available" | "booked" | "unavailable";

export type Venue = {
  id: number;
  vendorEmail: string;
  name: string;
  location: string;
  capacity: number;
  price: number;
  recommendedSuitability: string;
  description: string;
  image: string;
  status: VenueStatus;
};
