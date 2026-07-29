import { z } from "zod";

import {
  matchDecisions,
  matchStages,
  matchStatuses,
  tournamentModes,
  tournamentSourceKinds,
  tournamentStatuses,
  type TournamentSnapshot,
} from "./types";

const entityIdSchema = z.string().trim().min(1).max(100);
const isoDateTimeSchema = z.iso.datetime({ offset: true });
const countryCodeSchema = z.string().regex(/^[A-Z]{2}$/);

const timeZoneSchema = z.string().trim().min(1).refine(
  (timeZone) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone }).format();
      return true;
    } catch {
      return false;
    }
  },
  { message: "Invalid IANA time zone" },
);

export const tournamentSchema = z
  .object({
    id: entityIdSchema,
    name: z.string().trim().min(1).max(200),
    edition: z.number().int().min(1900).max(3000),
    mode: z.enum(tournamentModes),
    status: z.enum(tournamentStatuses),
    startsAt: isoDateTimeSchema,
    endsAt: isoDateTimeSchema,
    displayTimeZone: timeZoneSchema,
  })
  .strict()
  .superRefine((tournament, context) => {
    if (Date.parse(tournament.endsAt) < Date.parse(tournament.startsAt)) {
      context.addIssue({
        code: "custom",
        message: "Tournament end must not precede its start",
        path: ["endsAt"],
      });
    }
  });

export const teamSchema = z
  .object({
    id: entityIdSchema,
    name: z.string().trim().min(1).max(120),
    shortName: z.string().trim().min(1).max(40),
    code: z.string().trim().min(2).max(10),
    countryCode: countryCodeSchema.optional(),
  })
  .strict();

export const groupSchema = z
  .object({
    id: entityIdSchema,
    name: z.string().trim().min(1).max(80),
    teamIds: z.array(entityIdSchema),
  })
  .strict();

export const venueSchema = z
  .object({
    id: entityIdSchema,
    name: z.string().trim().min(1).max(160),
    city: z.string().trim().min(1).max(120),
    countryCode: countryCodeSchema,
    timeZone: timeZoneSchema,
  })
  .strict();

export const matchParticipantSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("team"),
      teamId: entityIdSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("group_position"),
      groupId: entityIdSchema,
      position: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      type: z.literal("match_winner"),
      matchId: entityIdSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("match_loser"),
      matchId: entityIdSchema,
    })
    .strict(),
]);

export const scoreLineSchema = z
  .object({
    home: z.number().int().nonnegative(),
    away: z.number().int().nonnegative(),
  })
  .strict();

export const matchScoreSchema = z
  .object({
    fullTime: scoreLineSchema,
    decidedBy: z.enum(matchDecisions),
    penalties: scoreLineSchema.optional(),
  })
  .strict()
  .superRefine((score, context) => {
    const fullTimeIsDraw = score.fullTime.home === score.fullTime.away;

    if (score.decidedBy === "penalties") {
      if (!score.penalties) {
        context.addIssue({
          code: "custom",
          message: "Penalty-decided matches require a penalty score",
          path: ["penalties"],
        });
      } else if (score.penalties.home === score.penalties.away) {
        context.addIssue({
          code: "custom",
          message: "A penalty shootout must have a winner",
          path: ["penalties"],
        });
      }

      if (!fullTimeIsDraw) {
        context.addIssue({
          code: "custom",
          message: "Penalty shootouts require a tied full-time score",
          path: ["fullTime"],
        });
      }
    } else if (score.penalties) {
      context.addIssue({
        code: "custom",
        message: "Penalty scores are only valid for penalty-decided matches",
        path: ["penalties"],
      });
    }

    if (score.decidedBy === "extra_time" && fullTimeIsDraw) {
      context.addIssue({
        code: "custom",
        message: "An extra-time decision must have a winner",
        path: ["fullTime"],
      });
    }
  });

export const matchSchema = z
  .object({
    id: entityIdSchema,
    matchNumber: z.number().int().positive(),
    stage: z.enum(matchStages),
    groupId: entityIdSchema.optional(),
    home: matchParticipantSchema,
    away: matchParticipantSchema,
    kickoffAt: isoDateTimeSchema,
    venueId: entityIdSchema.optional(),
    status: z.enum(matchStatuses),
    score: matchScoreSchema.optional(),
  })
  .strict()
  .superRefine((match, context) => {
    if (match.stage === "group" && !match.groupId) {
      context.addIssue({
        code: "custom",
        message: "Group-stage matches require a group",
        path: ["groupId"],
      });
    }

    if (match.status === "completed" && !match.score) {
      context.addIssue({
        code: "custom",
        message: "Completed matches require a score",
        path: ["score"],
      });
    }
  });

export const tournamentProvenanceSchema = z
  .object({
    kind: z.enum(tournamentSourceKinds),
    provider: z.string().trim().min(1).max(120),
    sourceUrl: z.url().optional(),
    retrievedAt: isoDateTimeSchema,
  })
  .strict();

export const tournamentSnapshotSchema = z
  .object({
    tournament: tournamentSchema,
    teams: z.array(teamSchema),
    groups: z.array(groupSchema),
    venues: z.array(venueSchema),
    matches: z.array(matchSchema),
    provenance: tournamentProvenanceSchema,
  })
  .strict()
  .superRefine((snapshot, context) => {
    validateUniqueIds(snapshot.teams, "teams", context);
    validateUniqueIds(snapshot.groups, "groups", context);
    validateUniqueIds(snapshot.venues, "venues", context);
    validateUniqueIds(snapshot.matches, "matches", context);

    const teamIds = new Set(snapshot.teams.map((team) => team.id));
    const groupsById = new Map(snapshot.groups.map((group) => [group.id, group]));
    const venueIds = new Set(snapshot.venues.map((venue) => venue.id));
    const matchIds = new Set(snapshot.matches.map((match) => match.id));
    const assignedTeams = new Map<string, string>();

    snapshot.groups.forEach((group, groupIndex) => {
      const groupTeamIds = new Set<string>();

      group.teamIds.forEach((teamId, teamIndex) => {
        if (!teamIds.has(teamId)) {
          addReferenceIssue(
            context,
            ["groups", groupIndex, "teamIds", teamIndex],
            `Unknown team reference: ${teamId}`,
          );
        }

        if (groupTeamIds.has(teamId)) {
          addReferenceIssue(
            context,
            ["groups", groupIndex, "teamIds", teamIndex],
            `Duplicate team reference in group: ${teamId}`,
          );
        }
        groupTeamIds.add(teamId);

        const previousGroupId = assignedTeams.get(teamId);
        if (previousGroupId && previousGroupId !== group.id) {
          addReferenceIssue(
            context,
            ["groups", groupIndex, "teamIds", teamIndex],
            `Team ${teamId} is already assigned to group ${previousGroupId}`,
          );
        } else {
          assignedTeams.set(teamId, group.id);
        }
      });
    });

    snapshot.matches.forEach((match, matchIndex) => {
      if (match.groupId && !groupsById.has(match.groupId)) {
        addReferenceIssue(
          context,
          ["matches", matchIndex, "groupId"],
          `Unknown group reference: ${match.groupId}`,
        );
      }

      if (match.venueId && !venueIds.has(match.venueId)) {
        addReferenceIssue(
          context,
          ["matches", matchIndex, "venueId"],
          `Unknown venue reference: ${match.venueId}`,
        );
      }

      validateParticipant(
        match.home,
        ["matches", matchIndex, "home"],
        match.id,
        teamIds,
        groupsById,
        matchIds,
        context,
      );
      validateParticipant(
        match.away,
        ["matches", matchIndex, "away"],
        match.id,
        teamIds,
        groupsById,
        matchIds,
        context,
      );

      if (
        match.home.type === "team" &&
        match.away.type === "team" &&
        match.home.teamId === match.away.teamId
      ) {
        addReferenceIssue(
          context,
          ["matches", matchIndex, "away"],
          "A team cannot play itself",
        );
      }
    });
  });

type ValidationContext = z.RefinementCtx;
type EntityWithId = Readonly<{ id: string }>;

function validateUniqueIds(
  entities: readonly EntityWithId[],
  collectionName: "teams" | "groups" | "venues" | "matches",
  context: ValidationContext,
) {
  const seenIds = new Set<string>();

  entities.forEach((entity, index) => {
    if (seenIds.has(entity.id)) {
      context.addIssue({
        code: "custom",
        message: `Duplicate ${collectionName} id: ${entity.id}`,
        path: [collectionName, index, "id"],
      });
    }
    seenIds.add(entity.id);
  });
}

function validateParticipant(
  participant: z.infer<typeof matchParticipantSchema>,
  path: (string | number)[],
  currentMatchId: string,
  teamIds: ReadonlySet<string>,
  groupsById: ReadonlyMap<string, z.infer<typeof groupSchema>>,
  matchIds: ReadonlySet<string>,
  context: ValidationContext,
) {
  if (participant.type === "team" && !teamIds.has(participant.teamId)) {
    addReferenceIssue(
      context,
      [...path, "teamId"],
      `Unknown team reference: ${participant.teamId}`,
    );
  }

  if (
    participant.type === "group_position" &&
    !groupsById.has(participant.groupId)
  ) {
    addReferenceIssue(
      context,
      [...path, "groupId"],
      `Unknown group reference: ${participant.groupId}`,
    );
  }

  if (
    (participant.type === "match_winner" ||
      participant.type === "match_loser") &&
    !matchIds.has(participant.matchId)
  ) {
    addReferenceIssue(
      context,
      [...path, "matchId"],
      `Unknown match reference: ${participant.matchId}`,
    );
  }

  if (
    (participant.type === "match_winner" ||
      participant.type === "match_loser") &&
    participant.matchId === currentMatchId
  ) {
    addReferenceIssue(
      context,
      [...path, "matchId"],
      "A match cannot reference itself",
    );
  }
}

function addReferenceIssue(
  context: ValidationContext,
  path: (string | number)[],
  message: string,
) {
  context.addIssue({
    code: "custom",
    message,
    path,
  });
}

export function parseTournamentSnapshot(input: unknown): TournamentSnapshot {
  return tournamentSnapshotSchema.parse(input);
}

export function safeParseTournamentSnapshot(input: unknown) {
  return tournamentSnapshotSchema.safeParse(input);
}
