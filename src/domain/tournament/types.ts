export const tournamentModes = ["official", "custom"] as const;
export type TournamentMode = (typeof tournamentModes)[number];

export const tournamentStatuses = [
  "draft",
  "scheduled",
  "active",
  "completed",
] as const;
export type TournamentStatus = (typeof tournamentStatuses)[number];

export const tournamentSourceKinds = [
  "official",
  "custom",
  "imported",
] as const;
export type TournamentSourceKind = (typeof tournamentSourceKinds)[number];

export const matchStages = [
  "group",
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
] as const;
export type MatchStage = (typeof matchStages)[number];

export const matchStatuses = [
  "scheduled",
  "live",
  "completed",
  "postponed",
  "cancelled",
] as const;
export type MatchStatus = (typeof matchStatuses)[number];

export const matchDecisions = [
  "regular_time",
  "extra_time",
  "penalties",
] as const;
export type MatchDecision = (typeof matchDecisions)[number];

export type TournamentId = string;
export type TeamId = string;
export type GroupId = string;
export type VenueId = string;
export type MatchId = string;
export type PlayerId = string;
export type MatchEventId = string;

export interface Tournament {
  readonly id: TournamentId;
  readonly name: string;
  readonly edition: number;
  readonly mode: TournamentMode;
  readonly status: TournamentStatus;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly displayTimeZone: string;
}

export interface Team {
  readonly id: TeamId;
  readonly name: string;
  readonly shortName: string;
  readonly code: string;
  readonly countryCode?: string;
}

export interface Player {
  readonly id: PlayerId;
  readonly teamId: TeamId;
  readonly name: string;
}

export const teamSheetPlayerRoles = [
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
] as const;
export type TeamSheetPlayerRole = (typeof teamSheetPlayerRoles)[number];

export interface TeamSheetPlayer {
  readonly playerId: PlayerId;
  readonly shirtNumber: number;
  readonly role: TeamSheetPlayerRole;
}

export interface MatchTeamSheet {
  readonly matchId: MatchId;
  readonly teamId: TeamId;
  readonly headCoach: {
    readonly id: string;
    readonly name: string;
  };
  /** Outfield structure only; the goalkeeper is implicit. */
  readonly formation: string;
  readonly starters: readonly TeamSheetPlayer[];
  readonly substitutes: readonly TeamSheetPlayer[];
}

export interface Group {
  readonly id: GroupId;
  readonly name: string;
  readonly teamIds: readonly TeamId[];
}

export interface Venue {
  readonly id: VenueId;
  readonly name: string;
  readonly city: string;
  readonly countryCode: string;
  readonly timeZone: string;
}

export type MatchParticipant =
  | {
      readonly type: "team";
      readonly teamId: TeamId;
    }
  | {
      readonly type: "group_position";
      readonly groupId: GroupId;
      readonly position: number;
    }
  | {
      readonly type: "match_winner";
      readonly matchId: MatchId;
    }
  | {
      readonly type: "match_loser";
      readonly matchId: MatchId;
    };

export interface ScoreLine {
  readonly home: number;
  readonly away: number;
}

export interface MatchScore {
  /**
   * Final goals after extra time when extra time was played.
   * Penalty shootout goals are stored separately.
   */
  readonly fullTime: ScoreLine;
  readonly decidedBy: MatchDecision;
  readonly penalties?: ScoreLine;
}

export interface Match {
  readonly id: MatchId;
  readonly matchNumber: number;
  readonly stage: MatchStage;
  readonly groupId?: GroupId;
  readonly home: MatchParticipant;
  readonly away: MatchParticipant;
  readonly kickoffAt: string;
  readonly venueId?: VenueId;
  readonly status: MatchStatus;
  readonly score?: MatchScore;
}

export const goalTypes = ["open_play", "penalty", "own_goal"] as const;
export type GoalType = (typeof goalTypes)[number];

export const cardTypes = ["yellow", "second_yellow", "red"] as const;
export type CardType = (typeof cardTypes)[number];

interface MatchEventBase {
  readonly id: MatchEventId;
  readonly matchId: MatchId;
  /** Stable source order within the match. */
  readonly sequence: number;
  /** Regulation or extra-time minute before added time. */
  readonly minute: number;
  readonly stoppageMinute?: number;
  /** Team credited with the goal or receiving the card. */
  readonly teamId: TeamId;
  readonly playerId: PlayerId;
}

export interface GoalEvent extends MatchEventBase {
  readonly type: "goal";
  /** `penalty` is an in-match penalty; shootout kicks stay in MatchScore. */
  readonly goalType: GoalType;
  readonly assistPlayerId?: PlayerId;
}

export interface CardEvent extends MatchEventBase {
  readonly type: "card";
  readonly cardType: CardType;
}

export type MatchEvent = GoalEvent | CardEvent;

export interface TournamentProvenance {
  readonly kind: TournamentSourceKind;
  readonly provider: string;
  readonly sourceUrl?: string;
  readonly retrievedAt: string;
}

export interface TournamentSnapshot {
  readonly tournament: Tournament;
  readonly teams: readonly Team[];
  readonly players: readonly Player[];
  readonly groups: readonly Group[];
  readonly venues: readonly Venue[];
  readonly matches: readonly Match[];
  readonly teamSheets: readonly MatchTeamSheet[];
  readonly matchEvents: readonly MatchEvent[];
  readonly provenance: TournamentProvenance;
}
