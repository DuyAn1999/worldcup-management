import type {
  Group,
  Match,
  TeamId,
  TournamentSnapshot,
} from "./types";

export type StandingsRankStatus = "resolved" | "provisional";

export type QualificationStatus =
  | "qualified"
  | "best_third_qualified"
  | "eliminated"
  | "pending";

export interface GroupStandingRow {
  readonly position: number;
  readonly teamId: TeamId;
  readonly played: number;
  readonly wins: number;
  readonly draws: number;
  readonly losses: number;
  readonly goalsFor: number;
  readonly goalsAgainst: number;
  readonly goalDifference: number;
  readonly points: number;
  readonly rankStatus: StandingsRankStatus;
  readonly qualificationStatus: QualificationStatus;
}

export interface GroupStandings {
  readonly groupId: string;
  readonly isComplete: boolean;
  readonly rows: readonly GroupStandingRow[];
}

export interface ThirdPlaceStanding {
  readonly position: number;
  readonly groupId: string;
  readonly teamId: TeamId;
  readonly played: number;
  readonly wins: number;
  readonly draws: number;
  readonly losses: number;
  readonly goalsFor: number;
  readonly goalsAgainst: number;
  readonly goalDifference: number;
  readonly points: number;
  readonly rankStatus: StandingsRankStatus;
  readonly qualificationStatus: QualificationStatus;
}

export interface TournamentStandings {
  readonly isComplete: boolean;
  readonly groups: readonly GroupStandings[];
  readonly thirdPlaceRanking: readonly ThirdPlaceStanding[];
}

type StandingsInput = Pick<TournamentSnapshot, "groups" | "matches">;

interface MutableStandingRecord {
  readonly teamId: TeamId;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

interface RankedRecord {
  readonly record: MutableStandingRecord;
  readonly unresolved: boolean;
}

interface CompletedGroupMatch {
  readonly homeTeamId: TeamId;
  readonly awayTeamId: TeamId;
  readonly homeGoals: number;
  readonly awayGoals: number;
}

const BEST_THIRD_QUALIFIER_COUNT = 8;

export function calculateTournamentStandings(
  input: StandingsInput,
): TournamentStandings {
  const initialGroups = input.groups.map((group) =>
    calculateGroupStandings(group, input.matches),
  );
  const isComplete = initialGroups.every((group) => group.isComplete);
  const thirdPlaceRanking = calculateThirdPlaceRanking(
    initialGroups,
    input.groups,
    isComplete,
  );
  const thirdQualificationByGroupId = new Map(
    thirdPlaceRanking.map((row) => [row.groupId, row.qualificationStatus]),
  );
  const groups = initialGroups.map((group) => ({
    ...group,
    rows: group.rows.map((row) => ({
      ...row,
      qualificationStatus: getGroupQualificationStatus(
        row,
        group.isComplete,
        thirdQualificationByGroupId.get(group.groupId),
      ),
    })),
  }));

  return {
    isComplete,
    groups,
    thirdPlaceRanking,
  };
}

function calculateGroupStandings(
  group: Group,
  matches: readonly Match[],
): GroupStandings {
  const records = new Map<TeamId, MutableStandingRecord>(
    group.teamIds.map((teamId) => [teamId, createEmptyRecord(teamId)]),
  );
  const completedMatches = getCompletedGroupMatches(group, matches);
  const completedPairKeys = new Set(
    completedMatches.map((match) => getPairKey(match.homeTeamId, match.awayTeamId)),
  );
  const expectedPairCount = (group.teamIds.length * (group.teamIds.length - 1)) / 2;
  const isComplete = completedPairKeys.size === expectedPairCount;

  completedMatches.forEach((match) => {
    const homeRecord = records.get(match.homeTeamId);
    const awayRecord = records.get(match.awayTeamId);

    if (!homeRecord || !awayRecord) return;
    applyResult(homeRecord, awayRecord, match.homeGoals, match.awayGoals);
  });

  const rankedRecords = rankGroupRecords(
    [...records.values()],
    completedMatches,
    group.teamIds,
  );

  return {
    groupId: group.id,
    isComplete,
    rows: rankedRecords.map(({ record, unresolved }, index) => ({
      position: index + 1,
      ...toStandingStats(record),
      rankStatus: isComplete && !unresolved ? "resolved" : "provisional",
      qualificationStatus: "pending",
    })),
  };
}

function getCompletedGroupMatches(
  group: Group,
  matches: readonly Match[],
): CompletedGroupMatch[] {
  const teamIds = new Set(group.teamIds);

  return matches.flatMap((match) => {
    if (
      match.stage !== "group" ||
      match.groupId !== group.id ||
      match.status !== "completed" ||
      !match.score ||
      match.home.type !== "team" ||
      match.away.type !== "team" ||
      !teamIds.has(match.home.teamId) ||
      !teamIds.has(match.away.teamId)
    ) {
      return [];
    }

    return [
      {
        homeTeamId: match.home.teamId,
        awayTeamId: match.away.teamId,
        homeGoals: match.score.fullTime.home,
        awayGoals: match.score.fullTime.away,
      },
    ];
  });
}

function rankGroupRecords(
  records: readonly MutableStandingRecord[],
  completedMatches: readonly CompletedGroupMatch[],
  originalTeamOrder: readonly TeamId[],
): RankedRecord[] {
  const orderByTeamId = new Map(
    originalTeamOrder.map((teamId, index) => [teamId, index]),
  );
  const pointsSorted = [...records].sort(
    (left, right) =>
      right.points - left.points ||
      getOriginalOrder(left.teamId, orderByTeamId) -
        getOriginalOrder(right.teamId, orderByTeamId),
  );

  return splitTiedRows(pointsSorted, (left, right) => left.points === right.points)
    .flatMap((pointGroup) =>
      resolveEqualPointsGroup(
        pointGroup,
        completedMatches,
        orderByTeamId,
      ),
    );
}

function resolveEqualPointsGroup(
  records: readonly MutableStandingRecord[],
  completedMatches: readonly CompletedGroupMatch[],
  orderByTeamId: ReadonlyMap<TeamId, number>,
): RankedRecord[] {
  if (records.length === 1) {
    return [{ record: records[0], unresolved: false }];
  }

  const tiedTeamIds = new Set(records.map((record) => record.teamId));
  const headToHeadRecords = new Map<TeamId, MutableStandingRecord>(
    records.map((record) => [record.teamId, createEmptyRecord(record.teamId)]),
  );

  completedMatches.forEach((match) => {
    if (
      !tiedTeamIds.has(match.homeTeamId) ||
      !tiedTeamIds.has(match.awayTeamId)
    ) {
      return;
    }

    const homeRecord = headToHeadRecords.get(match.homeTeamId);
    const awayRecord = headToHeadRecords.get(match.awayTeamId);
    if (!homeRecord || !awayRecord) return;
    applyResult(homeRecord, awayRecord, match.homeGoals, match.awayGoals);
  });

  const headToHeadSorted = [...records].sort((left, right) => {
    const leftHeadToHead = headToHeadRecords.get(left.teamId);
    const rightHeadToHead = headToHeadRecords.get(right.teamId);

    return (
      compareStandingCriteria(leftHeadToHead, rightHeadToHead) ||
      getOriginalOrder(left.teamId, orderByTeamId) -
        getOriginalOrder(right.teamId, orderByTeamId)
    );
  });

  return splitTiedRows(headToHeadSorted, (left, right) =>
    haveEqualStandingCriteria(
      headToHeadRecords.get(left.teamId),
      headToHeadRecords.get(right.teamId),
    ),
  ).flatMap((headToHeadGroup) =>
    resolveWithOverallCriteria(headToHeadGroup, orderByTeamId),
  );
}

function resolveWithOverallCriteria(
  records: readonly MutableStandingRecord[],
  orderByTeamId: ReadonlyMap<TeamId, number>,
): RankedRecord[] {
  if (records.length === 1) {
    return [{ record: records[0], unresolved: false }];
  }

  const overallSorted = [...records].sort(
    (left, right) =>
      getGoalDifference(right) - getGoalDifference(left) ||
      right.goalsFor - left.goalsFor ||
      getOriginalOrder(left.teamId, orderByTeamId) -
        getOriginalOrder(right.teamId, orderByTeamId),
  );

  return splitTiedRows(
    overallSorted,
    (left, right) =>
      getGoalDifference(left) === getGoalDifference(right) &&
      left.goalsFor === right.goalsFor,
  ).flatMap((overallGroup) => {
    const unresolved = overallGroup.length > 1;
    return overallGroup.map((record) => ({ record, unresolved }));
  });
}

function calculateThirdPlaceRanking(
  groups: readonly GroupStandings[],
  groupDefinitions: readonly Group[],
  allGroupsComplete: boolean,
): ThirdPlaceStanding[] {
  const groupOrderById = new Map(
    groupDefinitions.map((group, index) => [group.id, index]),
  );
  const candidates = groups.flatMap((group) => {
    const row = group.rows.find((candidate) => candidate.position === 3);
    return row ? [{ groupId: group.groupId, row }] : [];
  });
  const rankingCanBeFinal =
    allGroupsComplete &&
    candidates.length === groupDefinitions.length &&
    candidates.every(({ row }) => row.rankStatus === "resolved");
  const sortedCandidates = [...candidates].sort(
    (left, right) =>
      right.row.points - left.row.points ||
      right.row.goalDifference - left.row.goalDifference ||
      right.row.goalsFor - left.row.goalsFor ||
      getGroupOrder(left.groupId, groupOrderById) -
        getGroupOrder(right.groupId, groupOrderById),
  );
  const qualifyingCount = Math.min(
    BEST_THIRD_QUALIFIER_COUNT,
    sortedCandidates.length,
  );

  if (!rankingCanBeFinal) {
    return sortedCandidates.map(({ groupId, row }, index) => ({
      position: index + 1,
      groupId,
      ...copyStandingStats(row),
      rankStatus: "provisional",
      qualificationStatus: "pending",
    }));
  }

  const tiedGroups = splitTiedRows(
    sortedCandidates,
    (left, right) =>
      left.row.points === right.row.points &&
      left.row.goalDifference === right.row.goalDifference &&
      left.row.goalsFor === right.row.goalsFor,
  );
  let offset = 0;

  return tiedGroups.flatMap((tiedGroup) => {
    const startIndex = offset;
    const endIndex = offset + tiedGroup.length - 1;
    const crossesQualificationBoundary =
      startIndex < qualifyingCount && endIndex >= qualifyingCount;
    const qualificationStatus: QualificationStatus =
      crossesQualificationBoundary
        ? "pending"
        : endIndex < qualifyingCount
          ? "best_third_qualified"
          : "eliminated";
    offset += tiedGroup.length;

    return tiedGroup.map(({ groupId, row }, index) => ({
      position: startIndex + index + 1,
      groupId,
      ...copyStandingStats(row),
      rankStatus: tiedGroup.length > 1 ? "provisional" : "resolved",
      qualificationStatus,
    }));
  });
}

function getGroupQualificationStatus(
  row: GroupStandingRow,
  groupIsComplete: boolean,
  thirdPlaceStatus: QualificationStatus | undefined,
): QualificationStatus {
  if (!groupIsComplete || row.rankStatus === "provisional") return "pending";
  if (row.position <= 2) return "qualified";
  if (row.position === 3) return thirdPlaceStatus ?? "pending";
  return "eliminated";
}

function createEmptyRecord(teamId: TeamId): MutableStandingRecord {
  return {
    teamId,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  };
}

function applyResult(
  homeRecord: MutableStandingRecord,
  awayRecord: MutableStandingRecord,
  homeGoals: number,
  awayGoals: number,
) {
  homeRecord.played += 1;
  awayRecord.played += 1;
  homeRecord.goalsFor += homeGoals;
  homeRecord.goalsAgainst += awayGoals;
  awayRecord.goalsFor += awayGoals;
  awayRecord.goalsAgainst += homeGoals;

  if (homeGoals > awayGoals) {
    homeRecord.wins += 1;
    awayRecord.losses += 1;
    homeRecord.points += 3;
  } else if (awayGoals > homeGoals) {
    awayRecord.wins += 1;
    homeRecord.losses += 1;
    awayRecord.points += 3;
  } else {
    homeRecord.draws += 1;
    awayRecord.draws += 1;
    homeRecord.points += 1;
    awayRecord.points += 1;
  }
}

function compareStandingCriteria(
  left: MutableStandingRecord | undefined,
  right: MutableStandingRecord | undefined,
) {
  if (!left || !right) return 0;

  return (
    right.points - left.points ||
    getGoalDifference(right) - getGoalDifference(left) ||
    right.goalsFor - left.goalsFor
  );
}

function haveEqualStandingCriteria(
  left: MutableStandingRecord | undefined,
  right: MutableStandingRecord | undefined,
) {
  return (
    left !== undefined &&
    right !== undefined &&
    left.points === right.points &&
    getGoalDifference(left) === getGoalDifference(right) &&
    left.goalsFor === right.goalsFor
  );
}

function splitTiedRows<T>(
  rows: readonly T[],
  isTied: (left: T, right: T) => boolean,
) {
  return rows.reduce<T[][]>((groups, row) => {
    const currentGroup = groups.at(-1);
    if (!currentGroup || !isTied(currentGroup[0], row)) {
      groups.push([row]);
    } else {
      currentGroup.push(row);
    }
    return groups;
  }, []);
}

function toStandingStats(record: MutableStandingRecord) {
  return {
    teamId: record.teamId,
    played: record.played,
    wins: record.wins,
    draws: record.draws,
    losses: record.losses,
    goalsFor: record.goalsFor,
    goalsAgainst: record.goalsAgainst,
    goalDifference: getGoalDifference(record),
    points: record.points,
  };
}

function copyStandingStats(row: GroupStandingRow) {
  return {
    teamId: row.teamId,
    played: row.played,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference: row.goalDifference,
    points: row.points,
  };
}

function getGoalDifference(record: MutableStandingRecord) {
  return record.goalsFor - record.goalsAgainst;
}

function getPairKey(leftTeamId: TeamId, rightTeamId: TeamId) {
  return [leftTeamId, rightTeamId].sort().join(":");
}

function getOriginalOrder(
  teamId: TeamId,
  orderByTeamId: ReadonlyMap<TeamId, number>,
) {
  return orderByTeamId.get(teamId) ?? Number.MAX_SAFE_INTEGER;
}

function getGroupOrder(
  groupId: string,
  orderByGroupId: ReadonlyMap<string, number>,
) {
  return orderByGroupId.get(groupId) ?? Number.MAX_SAFE_INTEGER;
}
