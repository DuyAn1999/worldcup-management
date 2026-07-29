import type {
  TournamentId,
  TournamentSnapshot,
  TournamentSourceKind,
} from "@/domain/tournament/types";

/**
 * Boundary implemented by official, custom, or imported tournament sources.
 * Implementations must return a runtime-validated domain snapshot.
 */
export interface TournamentDataSource {
  readonly kind: TournamentSourceKind;
  loadTournament(tournamentId: TournamentId): Promise<TournamentSnapshot>;
}
