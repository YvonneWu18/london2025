export enum ActivityType {
  FLIGHT = 'Flight',
  FOOD = 'Food',
  SIGHTSEEING = 'Sightseeing',
  TRANSPORT = 'Transport',
  HOTEL = 'Hotel',
  SHOPPING = 'Shopping',
  EVENT = 'Event'
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  description: string;
  type: ActivityType;
  locationName: string;
  coordinates?: LocationCoordinates; // For Apple Maps
  notes?: string;
  price?: string;
  duration?: number; // Duration in minutes
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "Day 1", "Day 2"
  title: string; // Theme of the day
  weatherPrediction?: string; // Pre-filled or fetched
  items: ItineraryItem[];
}

export interface WeatherData {
  condition: string;
  tempHigh: number;
  tempLow: number;
  advice: string;
  rainChance: number;
}