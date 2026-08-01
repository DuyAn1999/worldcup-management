import {
  FIFA_WORLD_CUP_2026_ID,
  fifaWorldCup2026Snapshot,
} from "@/data/fifa-world-cup-2026/snapshot";
import type { TournamentDataSource } from "@/data-sources/tournament-data-source";
import type {
  TournamentId,
  TournamentSnapshot,
} from "@/domain/tournament/types";

export class Fifa2026StaticDataSource implements TournamentDataSource {
  readonly kind = "official" as const;

  async loadTournament(
    tournamentId: TournamentId,
  ): Promise<TournamentSnapshot> {
    if (tournamentId !== FIFA_WORLD_CUP_2026_ID) {
      throw new Error(`Unknown tournament: ${tournamentId}`);
    }

    return fifaWorldCup2026Snapshot;
  }
}

export const fifa2026StaticDataSource = new Fifa2026StaticDataSource();
