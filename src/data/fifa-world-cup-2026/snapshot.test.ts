import { describe, expect, it } from "vitest";

import { fifa2026StaticDataSource } from "@/data-sources/fifa-2026-static-data-source";
import type { Match, MatchStage } from "@/domain/tournament/types";

import { fifaWorldCup2026KnockoutEventSources } from "./event-sources";
import {
  FIFA_WORLD_CUP_2026_ID,
  fifaWorldCup2026Snapshot,
} from "./snapshot";

describe("FIFA World Cup 2026 static snapshot", () => {
  it("contains the complete tournament structure", () => {
    expect(fifaWorldCup2026Snapshot.teams).toHaveLength(48);
    expect(fifaWorldCup2026Snapshot.groups).toHaveLength(12);
    expect(fifaWorldCup2026Snapshot.venues).toHaveLength(16);
    expect(fifaWorldCup2026Snapshot.matches).toHaveLength(104);
    expect(fifaWorldCup2026Snapshot.players).toHaveLength(60);
    expect(fifaWorldCup2026Snapshot.matchEvents).toHaveLength(93);
    expect(
      fifaWorldCup2026Snapshot.groups.every(
        (group) => group.teamIds.length === 4,
      ),
    ).toBe(true);
  });

  it("attributes every knockout goal to the verified final score", () => {
    for (let matchNumber = 73; matchNumber <= 104; matchNumber += 1) {
      const match = findMatch(matchNumber);

      if (
        match.home.type !== "team" ||
        match.away.type !== "team" ||
        !match.score
      ) {
        throw new Error(`Match ${matchNumber} is missing resolved result data`);
      }

      const matchGoals = fifaWorldCup2026Snapshot.matchEvents.filter(
        (event) => event.matchId === match.id && event.type === "goal",
      );
      const homeTeamId = match.home.teamId;
      const awayTeamId = match.away.teamId;

      expect(
        matchGoals.filter((event) => event.teamId === homeTeamId),
        `Match ${matchNumber} home goals`,
      ).toHaveLength(match.score.fullTime.home);
      expect(
        matchGoals.filter((event) => event.teamId === awayTeamId),
        `Match ${matchNumber} away goals`,
      ).toHaveLength(match.score.fullTime.away);
    }
  });

  it("keeps an auditable official source for every knockout match", () => {
    expect(fifaWorldCup2026KnockoutEventSources).toHaveLength(32);
    expect(
      fifaWorldCup2026KnockoutEventSources.map((source) => source.matchNumber),
    ).toEqual(Array.from({ length: 32 }, (_, index) => index + 73));

    for (const source of fifaWorldCup2026KnockoutEventSources) {
      expect(source.fifaMatchId).toMatch(/^400\d{6}$/);
      expect(source.sourceUrl).toMatch(
        /^https:\/\/api\.fifa\.com\/api\/v3\/live\/football\/17\/285023\//,
      );
      expect(source.sourceUrl).toContain(source.fifaMatchId);
    }
  });

  it("preserves representative knockout goal semantics", () => {
    expectGoal("match-73-goal-1").toMatchObject({
      minute: 90,
      stoppageMinute: 2,
      teamId: "canada",
      playerId: "fifa-433635",
      goalType: "open_play",
    });
    expectGoal("match-86-goal-5").toMatchObject({
      minute: 111,
      teamId: "argentina",
      playerId: "fifa-409241",
      goalType: "own_goal",
    });
    expectGoal("match-101-goal-1").toMatchObject({
      minute: 22,
      teamId: "spain",
      playerId: "fifa-430751",
      goalType: "penalty",
    });
    expectGoal("match-104-goal-1").toMatchObject({
      minute: 106,
      teamId: "spain",
      playerId: "fifa-405545",
      goalType: "open_play",
    });
  });

  it("excludes penalty-shootout kicks from match events", () => {
    expect(
      fifaWorldCup2026Snapshot.matchEvents.filter(
        (event) => event.matchId === "match-74",
      ),
    ).toHaveLength(2);
    expect(
      fifaWorldCup2026Snapshot.matchEvents.filter(
        (event) => event.matchId === "match-96",
      ),
    ).toHaveLength(0);
  });

  it("contains every match number exactly once", () => {
    const matchNumbers = fifaWorldCup2026Snapshot.matches
      .map((match) => match.matchNumber)
      .sort((left, right) => left - right);

    expect(matchNumbers).toEqual(
      Array.from({ length: 104 }, (_, index) => index + 1),
    );
  });

  it("contains the expected number of matches in every stage", () => {
    const expectedStageCounts: Record<MatchStage, number> = {
      group: 72,
      round_of_32: 16,
      round_of_16: 8,
      quarter_final: 4,
      semi_final: 2,
      third_place: 1,
      final: 1,
    };

    for (const [stage, count] of Object.entries(expectedStageCounts)) {
      expect(
        fifaWorldCup2026Snapshot.matches.filter(
          (match) => match.stage === stage,
        ),
      ).toHaveLength(count);
    }
  });

  it("resolves every completed participant, score, venue, and group", () => {
    const teamIds = new Set(
      fifaWorldCup2026Snapshot.teams.map((team) => team.id),
    );
    const venueIds = new Set(
      fifaWorldCup2026Snapshot.venues.map((venue) => venue.id),
    );
    const groupIds = new Set(
      fifaWorldCup2026Snapshot.groups.map((group) => group.id),
    );
    const groupIdsByTeamId = new Map(
      fifaWorldCup2026Snapshot.groups.flatMap((group) =>
        group.teamIds.map((teamId) => [teamId, group.id] as const),
      ),
    );

    for (const match of fifaWorldCup2026Snapshot.matches) {
      expect(match.status).toBe("completed");
      expect(match.score).toBeDefined();
      expect(match.home.type).toBe("team");
      expect(match.away.type).toBe("team");
      expect(match.venueId && venueIds.has(match.venueId)).toBe(true);

      if (match.home.type === "team") {
        expect(teamIds.has(match.home.teamId)).toBe(true);
      }

      if (match.away.type === "team") {
        expect(teamIds.has(match.away.teamId)).toBe(true);
      }

      if (match.stage === "group") {
        expect(match.groupId && groupIds.has(match.groupId)).toBe(true);
        if (match.home.type === "team" && match.away.type === "team") {
          expect(groupIdsByTeamId.get(match.home.teamId)).toBe(match.groupId);
          expect(groupIdsByTeamId.get(match.away.teamId)).toBe(match.groupId);
        }
      } else {
        expect(match.groupId).toBeUndefined();
      }
    }
  });

  it("preserves official opening, shootout, and final sentinels", () => {
    expectMatch(1).toMatchObject({
      kickoffAt: "2026-06-11T15:00:00-04:00",
      venueId: "mexico-city",
      home: { type: "team", teamId: "mexico" },
      away: { type: "team", teamId: "south-africa" },
      score: {
        fullTime: { home: 2, away: 0 },
        decidedBy: "regular_time",
      },
    });
    expectMatch(74).toMatchObject({
      home: { type: "team", teamId: "germany" },
      away: { type: "team", teamId: "paraguay" },
      score: {
        fullTime: { home: 1, away: 1 },
        decidedBy: "penalties",
        penalties: { home: 3, away: 4 },
      },
    });
    expectMatch(104).toMatchObject({
      kickoffAt: "2026-07-19T15:00:00-04:00",
      venueId: "new-york-new-jersey",
      stage: "final",
      home: { type: "team", teamId: "spain" },
      away: { type: "team", teamId: "argentina" },
      score: {
        fullTime: { home: 1, away: 0 },
        decidedBy: "extra_time",
      },
    });
  });

  it("loads through the official static data-source boundary", async () => {
    await expect(
      fifa2026StaticDataSource.loadTournament(FIFA_WORLD_CUP_2026_ID),
    ).resolves.toBe(fifaWorldCup2026Snapshot);
    await expect(
      fifa2026StaticDataSource.loadTournament("unknown-tournament"),
    ).rejects.toThrow("Unknown tournament: unknown-tournament");
  });
});

function expectMatch(matchNumber: number) {
  const match = findMatch(matchNumber);

  return expect(match);
}

function findMatch(matchNumber: number): Match {
  const match = fifaWorldCup2026Snapshot.matches.find(
    (candidate) => candidate.matchNumber === matchNumber,
  );

  if (!match) {
    throw new Error(`Unknown match number: ${matchNumber}`);
  }

  return match;
}

function expectGoal(eventId: string) {
  const event = fifaWorldCup2026Snapshot.matchEvents.find(
    (candidate) => candidate.id === eventId,
  );

  expect(event).toBeDefined();
  expect(event?.type).toBe("goal");
  return expect(event);
}
