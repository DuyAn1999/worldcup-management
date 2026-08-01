import type {
  Tournament,
  TournamentProvenance,
} from "@/domain/tournament/types";

export const FIFA_WORLD_CUP_2026_ID = "fifa-world-cup-2026";

export const FIFA_WORLD_CUP_2026_RESULTS_URL =
  "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums";

export const FIFA_WORLD_CUP_2026_SCHEDULE_URL =
  "https://digitalhub.fifa.com/asset/4b5d4417-3343-4732-9cdf-14b6662af407/FWC26-Match-Schedule_English.pdf";

export const fifaWorldCup2026Tournament = {
  id: FIFA_WORLD_CUP_2026_ID,
  name: "FIFA World Cup 2026",
  edition: 2026,
  mode: "official",
  status: "completed",
  startsAt: "2026-06-11T15:00:00-04:00",
  endsAt: "2026-07-19T15:00:00-04:00",
  displayTimeZone: "America/New_York",
} satisfies Tournament;

export const fifaWorldCup2026Provenance = {
  kind: "official",
  provider: "FIFA",
  sourceUrl: FIFA_WORLD_CUP_2026_RESULTS_URL,
  retrievedAt: "2026-07-29T00:00:00+07:00",
} satisfies TournamentProvenance;
