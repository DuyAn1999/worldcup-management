import { describe, expect, it } from "vitest";

import { fifa2026StaticDataSource } from "@/data-sources/fifa-2026-static-data-source";
import type { Match, MatchStage } from "@/domain/tournament/types";

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
    expect(
      fifaWorldCup2026Snapshot.groups.every(
        (group) => group.teamIds.length === 4,
      ),
    ).toBe(true);
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
  const match = fifaWorldCup2026Snapshot.matches.find(
    (candidate) => candidate.matchNumber === matchNumber,
  );

  expect(match).toBeDefined();
  return expect(match as Match);
}
