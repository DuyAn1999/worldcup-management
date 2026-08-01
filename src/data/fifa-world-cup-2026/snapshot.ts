import { parseTournamentSnapshot } from "@/domain/tournament/schema";

import { fifaWorldCup2026Groups } from "./groups";
import { fifaWorldCup2026Matches } from "./matches";
import {
  FIFA_WORLD_CUP_2026_ID,
  fifaWorldCup2026Provenance,
  fifaWorldCup2026Tournament,
} from "./metadata";
import { fifaWorldCup2026Teams } from "./teams";
import { fifaWorldCup2026Venues } from "./venues";

export const fifaWorldCup2026Snapshot = parseTournamentSnapshot({
  tournament: fifaWorldCup2026Tournament,
  teams: fifaWorldCup2026Teams,
  groups: fifaWorldCup2026Groups,
  venues: fifaWorldCup2026Venues,
  matches: fifaWorldCup2026Matches,
  provenance: fifaWorldCup2026Provenance,
});

export { FIFA_WORLD_CUP_2026_ID };
