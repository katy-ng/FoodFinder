export interface FoodEvent {
  id: number;
  name: string;
  descriptionPlain: string;
  descriptionHtml: string;
  startsOn: string;
  endsOn: string;
  categories: string[];
  foodTypes: string[];
  theme: string;
  organization: string;
  locationName: string;
  locationAddress?: string;
  latitude: number;
  longitude: number;
  coordinatesApproximate: boolean;
  imageUrl: string;
  reservations: string;
  mapDayStartNy: string;
  onMapSampleDay: boolean;
}

export interface EventsPayload {
  generatedAt: string;
  mapFilterNote: string;
  mapDay: string;
  events: FoodEvent[];
}

export interface UserSession {
  email: string;
  displayName: string;
}
