import { describe, expect, it } from "vitest";

import { fifaWorldCup2026Snapshot } from "@/data/fifa-world-cup-2026/snapshot";

import { calculateTournamentStandings } from "./standings";
import type { Group, Match, TeamId } from "./types";

describe("calculateTournamentStandings", () => {
  it("calculates table statistics and preserves the input", () => {
    const group = createGroup("group-a", ["alpha", "bravo", "charlie", "delta"]);
    const matches = [
      completedMatch(1, group.id, "alpha", "bravo", 2, 0),
      completedMatch(2, group.id, "charlie", "delta", 1, 1),
      completedMatch(3, group.id, "alpha", "charlie", 1, 1),
      completedMatch(4, group.id, "bravo", "delta", 3, 0),
      completedMatch(5, group.id, "delta", "alpha", 0, 1),
      completedMatch(6, group.id, "bravo", "charlie", 0, 2),
    ];
    const input = { groups: [group], matches };
    const originalInput = structuredClone(input);

    const standings = calculateTournamentStandings(input);

    expect(input).toEqual(originalInput);
    expect(standings.isComplete).toBe(true);
    expect(standings.groups[0].rows).toEqual([
      {
        position: 1,
        teamId: "alpha",
        played: 3,
        wins: 2,
        draws: 1,
        losses: 0,
        goalsFor: 4,
        goalsAgainst: 1,
        goalDifference: 3,
        points: 7,
        rankStatus: "resolved",
        qualificationStatus: "qualified",
      },
      {
        position: 2,
        teamId: "charlie",
        played: 3,
        wins: 1,
        draws: 2,
        losses: 0,
        goalsFor: 4,
        goalsAgainst: 2,
        goalDifference: 2,
        points: 5,
        rankStatus: "resolved",
        qualificationStatus: "qualified",
      },
      {
        position: 3,
        teamId: "bravo",
        played: 3,
        wins: 1,
        draws: 0,
        losses: 2,
        goalsFor: 3,
        goalsAgainst: 4,
        goalDifference: -1,
        points: 3,
        rankStatus: "resolved",
        qualificationStatus: "best_third_qualified",
      },
      {
        position: 4,
        teamId: "delta",
        played: 3,
        wins: 0,
        draws: 1,
        losses: 2,
        goalsFor: 1,
        goalsAgainst: 5,
        goalDifference: -4,
        points: 1,
        rankStatus: "resolved",
        qualificationStatus: "eliminated",
      },
    ]);
  });

  it("applies the 2026 head-to-head criteria before overall goal difference", () => {
    const group = createGroup("group-a", ["alpha", "bravo", "charlie", "delta"]);
    const matches = [
      completedMatch(1, group.id, "alpha", "bravo", 0, 1),
      completedMatch(2, group.id, "alpha", "charlie", 5, 0),
      completedMatch(3, group.id, "alpha", "delta", 0, 1),
      completedMatch(4, group.id, "bravo", "charlie", 0, 1),
      completedMatch(5, group.id, "bravo", "delta", 0, 1),
      completedMatch(6, group.id, "charlie", "delta", 0, 0),
    ];

    const rows = calculateTournamentStandings({ groups: [group], matches })
      .groups[0].rows;

    expect(rows.find((row) => row.teamId === "alpha")?.points).toBe(3);
    expect(rows.find((row) => row.teamId === "bravo")?.points).toBe(3);
    expect(rows.find((row) => row.teamId === "alpha")?.goalDifference).toBe(3);
    expect(rows.find((row) => row.teamId === "bravo")?.goalDifference).toBe(-1);
    expect(rows.map((row) => row.teamId).indexOf("bravo")).toBeLessThan(
      rows.map((row) => row.teamId).indexOf("alpha"),
    );
  });

  it("uses overall goal difference after tied head-to-head criteria", () => {
    const group = createGroup("group-a", ["alpha", "bravo", "charlie", "delta"]);
    const matches = [
      completedMatch(1, group.id, "alpha", "bravo", 0, 0),
      completedMatch(2, group.id, "alpha", "charlie", 3, 0),
      completedMatch(3, group.id, "alpha", "delta", 0, 1),
      completedMatch(4, group.id, "bravo", "charlie", 1, 0),
      completedMatch(5, group.id, "bravo", "delta", 0, 1),
      completedMatch(6, group.id, "charlie", "delta", 0, 0),
    ];

    const rows = calculateTournamentStandings({ groups: [group], matches })
      .groups[0].rows;

    expect(rows.find((row) => row.teamId === "alpha")?.points).toBe(4);
    expect(rows.find((row) => row.teamId === "bravo")?.points).toBe(4);
    expect(rows.map((row) => row.teamId).indexOf("alpha")).toBeLessThan(
      rows.map((row) => row.teamId).indexOf("bravo"),
    );
    expect(rows.find((row) => row.teamId === "alpha")?.rankStatus).toBe(
      "resolved",
    );
  });

  it("marks a completed unresolved tie as provisional", () => {
    const group = createGroup("group-a", ["alpha", "bravo"]);
    const matches = [completedMatch(1, group.id, "alpha", "bravo", 0, 0)];

    const standings = calculateTournamentStandings({ groups: [group], matches });

    expect(standings.groups[0].isComplete).toBe(true);
    expect(standings.groups[0].rows.map((row) => row.teamId)).toEqual([
      "alpha",
      "bravo",
    ]);
    expect(standings.groups[0].rows.every((row) => row.rankStatus === "provisional"))
      .toBe(true);
    expect(
      standings.groups[0].rows.every(
        (row) => row.qualificationStatus === "pending",
      ),
    ).toBe(true);
  });

  it("ignores unfinished matches and keeps partial standings provisional", () => {
    const group = createGroup("group-a", ["alpha", "bravo", "charlie", "delta"]);
    const matches = [
      completedMatch(1, group.id, "alpha", "bravo", 2, 0),
      scheduledMatch(2, group.id, "charlie", "delta"),
    ];

    const standings = calculateTournamentStandings({ groups: [group], matches });
    const rows = standings.groups[0].rows;

    expect(standings.isComplete).toBe(false);
    expect(rows.find((row) => row.teamId === "alpha")).toMatchObject({
      played: 1,
      points: 3,
      rankStatus: "provisional",
      qualificationStatus: "pending",
    });
    expect(rows.find((row) => row.teamId === "charlie")).toMatchObject({
      played: 0,
      points: 0,
      rankStatus: "provisional",
      qualificationStatus: "pending",
    });
  });

  it("selects the best eight third-place teams", () => {
    const groups = Array.from({ length: 9 }, (_, index) =>
      createGroup(`group-${index}`, [
        `winner-${index}`,
        `runner-${index}`,
        `third-${index}`,
      ]),
    );
    const matches = groups.flatMap((group, index) =>
      createThreeTeamGroupMatches(group, index + 1, index + 2),
    );

    const standings = calculateTournamentStandings({ groups, matches });

    expect(standings.thirdPlaceRanking).toHaveLength(9);
    expect(
      standings.thirdPlaceRanking.filter(
        (row) => row.qualificationStatus === "best_third_qualified",
      ),
    ).toHaveLength(8);
    expect(standings.thirdPlaceRanking.at(-1)).toMatchObject({
      groupId: "group-8",
      teamId: "third-8",
      qualificationStatus: "eliminated",
    });
    expect(
      standings.groups
        .flatMap((group) => group.rows)
        .find((row) => row.teamId === "third-0")?.qualificationStatus,
    ).toBe("best_third_qualified");
  });

  it("does not guess when a third-place tie crosses the qualification cutoff", () => {
    const groups = Array.from({ length: 9 }, (_, index) =>
      createGroup(`group-${index}`, [
        `winner-${index}`,
        `runner-${index}`,
        `third-${index}`,
      ]),
    );
    const matches = groups.flatMap((group) =>
      createThreeTeamGroupMatches(group, 1, 1),
    );

    const standings = calculateTournamentStandings({ groups, matches });

    expect(
      standings.thirdPlaceRanking.every(
        (row) =>
          row.rankStatus === "provisional" &&
          row.qualificationStatus === "pending",
      ),
    ).toBe(true);
  });

  it("calculates all twelve groups from the official snapshot", () => {
    const standings = calculateTournamentStandings(fifaWorldCup2026Snapshot);
    const groupA = standings.groups.find((group) => group.groupId === "group-a");

    expect(standings.isComplete).toBe(true);
    expect(standings.groups).toHaveLength(12);
    expect(standings.groups.every((group) => group.rows.length === 4)).toBe(true);
    expect(standings.thirdPlaceRanking).toHaveLength(12);
    expect(groupA?.rows.map((row) => row.teamId)).toEqual([
      "mexico",
      "south-africa",
      "korea-republic",
      "czechia",
    ]);
    expect(groupA?.rows.map((row) => row.points)).toEqual([9, 4, 3, 1]);
    expect(groupA?.rows.every((row) => row.played === 3)).toBe(true);
  });
});

function createGroup(id: string, teamIds: readonly TeamId[]): Group {
  return {
    id,
    name: id,
    teamIds,
  };
}

function createThreeTeamGroupMatches(
  group: Group,
  winnerGoalsAgainstThird: number,
  runnerGoalsAgainstThird: number,
) {
  const [winner, runner, third] = group.teamIds;

  return [
    completedMatch(getMatchNumber(group.id, 1), group.id, winner, runner, 1, 0),
    completedMatch(
      getMatchNumber(group.id, 2),
      group.id,
      winner,
      third,
      winnerGoalsAgainstThird,
      0,
    ),
    completedMatch(
      getMatchNumber(group.id, 3),
      group.id,
      runner,
      third,
      runnerGoalsAgainstThird,
      0,
    ),
  ];
}

function completedMatch(
  matchNumber: number,
  groupId: string,
  homeTeamId: TeamId,
  awayTeamId: TeamId,
  homeGoals: number,
  awayGoals: number,
): Match {
  return {
    id: `match-${matchNumber}`,
    matchNumber,
    stage: "group",
    groupId,
    home: { type: "team", teamId: homeTeamId },
    away: { type: "team", teamId: awayTeamId },
    kickoffAt: "2026-06-11T13:00:00-04:00",
    status: "completed",
    score: {
      fullTime: { home: homeGoals, away: awayGoals },
      decidedBy: "regular_time",
    },
  };
}

function scheduledMatch(
  matchNumber: number,
  groupId: string,
  homeTeamId: TeamId,
  awayTeamId: TeamId,
): Match {
  return {
    id: `match-${matchNumber}`,
    matchNumber,
    stage: "group",
    groupId,
    home: { type: "team", teamId: homeTeamId },
    away: { type: "team", teamId: awayTeamId },
    kickoffAt: "2026-06-11T13:00:00-04:00",
    status: "scheduled",
  };
}

function getMatchNumber(groupId: string, offset: number) {
  const groupIndex = Number(groupId.split("-").at(-1));
  return groupIndex * 10 + offset;
}
