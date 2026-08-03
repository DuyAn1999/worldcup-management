import { describe, expect, it } from "vitest";

import {
  parseTournamentSnapshot,
  safeParseTournamentSnapshot,
} from "./schema";
import type { TournamentSnapshot } from "./types";

function createValidSnapshot(): TournamentSnapshot {
  return {
    tournament: {
      id: "world-cup-2026",
      name: "World Cup 2026",
      edition: 2026,
      mode: "official",
      status: "scheduled",
      startsAt: "2026-06-11T13:00:00-04:00",
      endsAt: "2026-07-19T15:00:00-04:00",
      displayTimeZone: "America/New_York",
    },
    teams: [
      {
        id: "mexico",
        name: "Mexico",
        shortName: "Mexico",
        code: "MEX",
        countryCode: "MX",
      },
      {
        id: "south-africa",
        name: "South Africa",
        shortName: "South Africa",
        code: "RSA",
        countryCode: "ZA",
      },
    ],
    players: [
      {
        id: "mexico-scorer",
        teamId: "mexico",
        name: "Mexico Scorer",
      },
      {
        id: "mexico-assistant",
        teamId: "mexico",
        name: "Mexico Assistant",
      },
      {
        id: "south-africa-defender",
        teamId: "south-africa",
        name: "South Africa Defender",
      },
    ],
    groups: [
      {
        id: "group-a",
        name: "Group A",
        teamIds: ["mexico", "south-africa"],
      },
    ],
    venues: [
      {
        id: "mexico-city-stadium",
        name: "Mexico City Stadium",
        city: "Mexico City",
        countryCode: "MX",
        timeZone: "America/Mexico_City",
      },
    ],
    matches: [
      {
        id: "match-1",
        matchNumber: 1,
        stage: "group",
        groupId: "group-a",
        home: { type: "team", teamId: "mexico" },
        away: { type: "team", teamId: "south-africa" },
        kickoffAt: "2026-06-11T13:00:00-04:00",
        venueId: "mexico-city-stadium",
        status: "completed",
        score: {
          fullTime: { home: 2, away: 0 },
          decidedBy: "regular_time",
        },
      },
      {
        id: "match-73",
        matchNumber: 73,
        stage: "round_of_32",
        home: {
          type: "group_position",
          groupId: "group-a",
          position: 1,
        },
        away: { type: "match_winner", matchId: "match-1" },
        kickoffAt: "2026-06-28T15:00:00-07:00",
        status: "scheduled",
      },
    ],
    matchEvents: [
      {
        id: "match-1-goal-1",
        matchId: "match-1",
        sequence: 1,
        minute: 18,
        teamId: "mexico",
        playerId: "mexico-scorer",
        type: "goal",
        goalType: "open_play",
        assistPlayerId: "mexico-assistant",
      },
      {
        id: "match-1-card-1",
        matchId: "match-1",
        sequence: 2,
        minute: 45,
        stoppageMinute: 2,
        teamId: "south-africa",
        playerId: "south-africa-defender",
        type: "card",
        cardType: "yellow",
      },
      {
        id: "match-1-goal-2",
        matchId: "match-1",
        sequence: 3,
        minute: 71,
        teamId: "mexico",
        playerId: "south-africa-defender",
        type: "goal",
        goalType: "own_goal",
      },
    ],
    provenance: {
      kind: "official",
      provider: "FIFA",
      sourceUrl: "https://www.fifa.com/",
      retrievedAt: "2026-06-11T18:00:00Z",
    },
  };
}

describe("parseTournamentSnapshot", () => {
  it("accepts a valid official tournament snapshot", () => {
    const snapshot = createValidSnapshot();

    expect(parseTournamentSnapshot(snapshot)).toEqual(snapshot);
  });

  it("rejects duplicate entity ids", () => {
    const snapshot = createValidSnapshot();
    const result = safeParseTournamentSnapshot({
      ...snapshot,
      teams: [...snapshot.teams, snapshot.teams[0]],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("Duplicate teams id"),
        ),
      ).toBe(true);
    }
  });

  it("rejects unknown entity references", () => {
    const snapshot = createValidSnapshot();
    const result = safeParseTournamentSnapshot({
      ...snapshot,
      matches: [
        {
          ...snapshot.matches[0],
          home: { type: "team", teamId: "unknown-team" },
        },
        snapshot.matches[1],
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("Unknown team reference"),
        ),
      ).toBe(true);
    }
  });

  it("requires completed matches to include a score", () => {
    const snapshot = createValidSnapshot();
    const completedMatchWithoutScore = {
      ...snapshot.matches[0],
      score: undefined,
    };
    const result = safeParseTournamentSnapshot({
      ...snapshot,
      matches: [completedMatchWithoutScore, snapshot.matches[1]],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("Completed matches require a score"),
        ),
      ).toBe(true);
    }
  });

  it("rejects a tied penalty shootout", () => {
    const snapshot = createValidSnapshot();
    const result = safeParseTournamentSnapshot({
      ...snapshot,
      matches: [
        {
          ...snapshot.matches[0],
          score: {
            fullTime: { home: 1, away: 1 },
            decidedBy: "penalties",
            penalties: { home: 4, away: 4 },
          },
        },
        snapshot.matches[1],
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("penalty shootout must have a winner"),
        ),
      ).toBe(true);
    }
  });

  it("rejects unknown previous-match references", () => {
    const snapshot = createValidSnapshot();
    const result = safeParseTournamentSnapshot({
      ...snapshot,
      matches: [
        snapshot.matches[0],
        {
          ...snapshot.matches[1],
          away: { type: "match_winner", matchId: "unknown-match" },
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("Unknown match reference"),
        ),
      ).toBe(true);
    }
  });

  it("rejects unknown match, team, and player references in events", () => {
    const snapshot = createValidSnapshot();
    const result = safeParseTournamentSnapshot({
      ...snapshot,
      matchEvents: [
        {
          ...snapshot.matchEvents[0],
          matchId: "unknown-match",
          teamId: "unknown-team",
          playerId: "unknown-player",
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("Unknown match reference: unknown-match"),
        ),
      ).toBe(true);
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("Unknown player reference: unknown-player"),
        ),
      ).toBe(true);
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("Unknown team reference: unknown-team"),
        ),
      ).toBe(true);
    }
  });

  it("rejects an event team that does not participate in its match", () => {
    const snapshot = createValidSnapshot();
    const result = safeParseTournamentSnapshot({
      ...snapshot,
      teams: [
        ...snapshot.teams,
        {
          id: "canada",
          name: "Canada",
          shortName: "Canada",
          code: "CAN",
          countryCode: "CA",
        },
      ],
      players: [
        ...snapshot.players,
        { id: "canada-player", teamId: "canada", name: "Canada Player" },
      ],
      matchEvents: [
        {
          ...snapshot.matchEvents[1],
          teamId: "canada",
          playerId: "canada-player",
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("does not participate in match"),
        ),
      ).toBe(true);
    }
  });

  it("validates scorer, assist, card, and own-goal team relationships", () => {
    const snapshot = createValidSnapshot();
    const invalidEvents = [
      {
        ...snapshot.matchEvents[0],
        playerId: "south-africa-defender",
      },
      {
        ...snapshot.matchEvents[0],
        assistPlayerId: "south-africa-defender",
      },
      {
        ...snapshot.matchEvents[1],
        playerId: "mexico-scorer",
      },
      {
        ...snapshot.matchEvents[2],
        playerId: "mexico-scorer",
      },
    ];

    const results = invalidEvents.map((event) =>
      safeParseTournamentSnapshot({ ...snapshot, matchEvents: [event] }),
    );

    expect(results.every((result) => !result.success)).toBe(true);
    expect(
      results.some(
        (result) =>
          !result.success &&
          result.error.issues.some((issue) =>
            issue.message.includes("does not belong to event team"),
          ),
      ),
    ).toBe(true);
    expect(
      results.some(
        (result) =>
          !result.success &&
          result.error.issues.some((issue) =>
            issue.message.includes("own-goal scorer must belong"),
          ),
      ),
    ).toBe(true);
  });

  it("rejects self-assisted goals", () => {
    const snapshot = createValidSnapshot();
    const result = safeParseTournamentSnapshot({
      ...snapshot,
      matchEvents: [
        {
          ...snapshot.matchEvents[0],
          assistPlayerId: snapshot.matchEvents[0].playerId,
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("cannot assist their own goal"),
        ),
      ).toBe(true);
    }
  });

  it("rejects duplicate event ids and sequences within a match", () => {
    const snapshot = createValidSnapshot();
    const duplicateEvent = {
      ...snapshot.matchEvents[0],
      minute: 52,
    };
    const result = safeParseTournamentSnapshot({
      ...snapshot,
      matchEvents: [snapshot.matchEvents[0], duplicateEvent],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("Duplicate matchEvents id"),
        ),
      ).toBe(true);
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("Duplicate event sequence"),
        ),
      ).toBe(true);
    }
  });

  it("rejects invalid event minutes and stoppage time", () => {
    const snapshot = createValidSnapshot();
    const result = safeParseTournamentSnapshot({
      ...snapshot,
      matchEvents: [
        {
          ...snapshot.matchEvents[0],
          minute: 121,
          stoppageMinute: 0,
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
