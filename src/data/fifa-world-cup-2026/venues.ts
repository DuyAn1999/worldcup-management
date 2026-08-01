import type { Venue } from "@/domain/tournament/types";

export const fifaWorldCup2026Venues = [
  { id: "vancouver", name: "BC Place Vancouver", city: "Vancouver", countryCode: "CA", timeZone: "America/Vancouver" },
  { id: "seattle", name: "Seattle Stadium", city: "Seattle", countryCode: "US", timeZone: "America/Los_Angeles" },
  { id: "san-francisco-bay-area", name: "San Francisco Bay Area Stadium", city: "San Francisco Bay Area", countryCode: "US", timeZone: "America/Los_Angeles" },
  { id: "los-angeles", name: "Los Angeles Stadium", city: "Los Angeles", countryCode: "US", timeZone: "America/Los_Angeles" },
  { id: "guadalajara", name: "Guadalajara Stadium", city: "Guadalajara", countryCode: "MX", timeZone: "America/Mexico_City" },
  { id: "mexico-city", name: "Mexico City Stadium", city: "Mexico City", countryCode: "MX", timeZone: "America/Mexico_City" },
  { id: "monterrey", name: "Estadio Monterrey", city: "Monterrey", countryCode: "MX", timeZone: "America/Monterrey" },
  { id: "houston", name: "Houston Stadium", city: "Houston", countryCode: "US", timeZone: "America/Chicago" },
  { id: "dallas", name: "Dallas Stadium", city: "Dallas", countryCode: "US", timeZone: "America/Chicago" },
  { id: "kansas-city", name: "Kansas City Stadium", city: "Kansas City", countryCode: "US", timeZone: "America/Chicago" },
  { id: "atlanta", name: "Atlanta Stadium", city: "Atlanta", countryCode: "US", timeZone: "America/New_York" },
  { id: "miami", name: "Miami Stadium", city: "Miami", countryCode: "US", timeZone: "America/New_York" },
  { id: "toronto", name: "Toronto Stadium", city: "Toronto", countryCode: "CA", timeZone: "America/Toronto" },
  { id: "boston", name: "Boston Stadium", city: "Boston", countryCode: "US", timeZone: "America/New_York" },
  { id: "philadelphia", name: "Philadelphia Stadium", city: "Philadelphia", countryCode: "US", timeZone: "America/New_York" },
  { id: "new-york-new-jersey", name: "New York New Jersey Stadium", city: "New York New Jersey", countryCode: "US", timeZone: "America/New_York" },
] as const satisfies readonly Venue[];
