import type {
  GroupId,
  Match,
  MatchDecision,
  MatchStage,
  TeamId,
  VenueId,
} from "@/domain/tournament/types";

import { fifaWorldCup2026Groups } from "./groups";

type OfficialResultEntry = readonly [
  matchNumber: number,
  homeTeamId: TeamId,
  awayTeamId: TeamId,
  homeGoals: number,
  awayGoals: number,
  decision?: Exclude<MatchDecision, "regular_time">,
  homePenalties?: number,
  awayPenalties?: number,
];

type OfficialScheduleEntry = readonly [
  matchNumber: number,
  dayOffset: number,
  easternTime: string,
  venueId: VenueId,
];

const officialResults = [
  [1, "mexico", "south-africa", 2, 0],
  [2, "korea-republic", "czechia", 2, 1],
  [3, "canada", "bosnia-herzegovina", 1, 1],
  [4, "usa", "paraguay", 4, 1],
  [5, "haiti", "scotland", 0, 1],
  [6, "australia", "turkiye", 2, 0],
  [7, "brazil", "morocco", 1, 1],
  [8, "qatar", "switzerland", 1, 1],
  [9, "cote-divoire", "ecuador", 1, 0],
  [10, "germany", "curacao", 7, 1],
  [11, "netherlands", "japan", 2, 2],
  [12, "sweden", "tunisia", 5, 1],
  [13, "saudi-arabia", "uruguay", 1, 1],
  [14, "spain", "cabo-verde", 0, 0],
  [15, "ir-iran", "new-zealand", 2, 2],
  [16, "belgium", "egypt", 1, 1],
  [17, "france", "senegal", 3, 1],
  [18, "iraq", "norway", 1, 4],
  [19, "argentina", "algeria", 3, 0],
  [20, "austria", "jordan", 3, 1],
  [21, "ghana", "panama", 1, 0],
  [22, "england", "croatia", 4, 2],
  [23, "portugal", "congo-dr", 1, 1],
  [24, "uzbekistan", "colombia", 1, 3],
  [25, "czechia", "south-africa", 1, 1],
  [26, "switzerland", "bosnia-herzegovina", 4, 1],
  [27, "canada", "qatar", 6, 0],
  [28, "mexico", "korea-republic", 1, 0],
  [29, "brazil", "haiti", 3, 0],
  [30, "scotland", "morocco", 0, 1],
  [31, "turkiye", "paraguay", 0, 1],
  [32, "usa", "australia", 2, 0],
  [33, "germany", "cote-divoire", 2, 1],
  [34, "ecuador", "curacao", 0, 0],
  [35, "netherlands", "sweden", 5, 1],
  [36, "tunisia", "japan", 0, 4],
  [37, "uruguay", "cabo-verde", 2, 2],
  [38, "spain", "saudi-arabia", 4, 0],
  [39, "belgium", "ir-iran", 0, 0],
  [40, "new-zealand", "egypt", 1, 3],
  [41, "norway", "senegal", 3, 2],
  [42, "france", "iraq", 3, 0],
  [43, "argentina", "austria", 2, 0],
  [44, "jordan", "algeria", 1, 2],
  [45, "england", "ghana", 0, 0],
  [46, "panama", "croatia", 0, 1],
  [47, "portugal", "uzbekistan", 5, 0],
  [48, "colombia", "congo-dr", 1, 0],
  [49, "scotland", "brazil", 0, 3],
  [50, "morocco", "haiti", 4, 2],
  [51, "switzerland", "canada", 2, 1],
  [52, "bosnia-herzegovina", "qatar", 3, 1],
  [53, "czechia", "mexico", 0, 3],
  [54, "south-africa", "korea-republic", 1, 0],
  [55, "curacao", "cote-divoire", 0, 2],
  [56, "ecuador", "germany", 2, 1],
  [57, "japan", "sweden", 1, 1],
  [58, "tunisia", "netherlands", 1, 3],
  [59, "turkiye", "usa", 3, 2],
  [60, "paraguay", "australia", 0, 0],
  [61, "norway", "france", 1, 4],
  [62, "senegal", "iraq", 5, 0],
  [63, "egypt", "ir-iran", 1, 1],
  [64, "new-zealand", "belgium", 1, 5],
  [65, "cabo-verde", "saudi-arabia", 0, 0],
  [66, "uruguay", "spain", 0, 1],
  [67, "panama", "england", 0, 2],
  [68, "croatia", "ghana", 2, 1],
  [69, "algeria", "austria", 3, 3],
  [70, "jordan", "argentina", 1, 3],
  [71, "colombia", "portugal", 0, 0],
  [72, "congo-dr", "uzbekistan", 3, 1],
  [73, "south-africa", "canada", 0, 1],
  [74, "germany", "paraguay", 1, 1, "penalties", 3, 4],
  [75, "netherlands", "morocco", 1, 1, "penalties", 2, 3],
  [76, "brazil", "japan", 2, 1],
  [77, "france", "sweden", 3, 0],
  [78, "cote-divoire", "norway", 1, 2],
  [79, "mexico", "ecuador", 2, 0],
  [80, "england", "congo-dr", 2, 1],
  [81, "usa", "bosnia-herzegovina", 2, 0],
  [82, "belgium", "senegal", 3, 2, "extra_time"],
  [83, "portugal", "croatia", 2, 1],
  [84, "spain", "austria", 3, 0],
  [85, "switzerland", "algeria", 2, 0],
  [86, "argentina", "cabo-verde", 3, 2, "extra_time"],
  [87, "colombia", "ghana", 1, 0],
  [88, "australia", "egypt", 1, 1, "penalties", 2, 4],
  [89, "paraguay", "france", 0, 1],
  [90, "canada", "morocco", 0, 3],
  [91, "brazil", "norway", 1, 2],
  [92, "mexico", "england", 2, 3],
  [93, "portugal", "spain", 0, 1],
  [94, "usa", "belgium", 1, 4],
  [95, "argentina", "egypt", 3, 2],
  [96, "switzerland", "colombia", 0, 0, "penalties", 4, 3],
  [97, "france", "morocco", 2, 0],
  [98, "spain", "belgium", 2, 1],
  [99, "norway", "england", 1, 2, "extra_time"],
  [100, "argentina", "switzerland", 3, 1, "extra_time"],
  [101, "france", "spain", 0, 2],
  [102, "england", "argentina", 1, 2],
  [103, "france", "england", 4, 6],
  [104, "spain", "argentina", 1, 0, "extra_time"],
] as const satisfies readonly OfficialResultEntry[];

// Day offsets start at 11 June 2026; all times are Eastern Time, as published by FIFA.
const officialSchedule = [
  [1, 0, "15:00", "mexico-city"],
  [2, 0, "22:00", "guadalajara"],
  [3, 1, "15:00", "toronto"],
  [4, 1, "21:00", "los-angeles"],
  [5, 2, "21:00", "boston"],
  [6, 2, "00:00", "vancouver"],
  [7, 2, "18:00", "new-york-new-jersey"],
  [8, 2, "15:00", "san-francisco-bay-area"],
  [9, 3, "19:00", "philadelphia"],
  [10, 3, "13:00", "houston"],
  [11, 3, "16:00", "dallas"],
  [12, 3, "22:00", "monterrey"],
  [13, 4, "18:00", "miami"],
  [14, 4, "12:00", "atlanta"],
  [15, 4, "21:00", "los-angeles"],
  [16, 4, "15:00", "seattle"],
  [17, 5, "15:00", "new-york-new-jersey"],
  [18, 5, "18:00", "boston"],
  [19, 5, "21:00", "kansas-city"],
  [20, 5, "00:00", "san-francisco-bay-area"],
  [21, 6, "19:00", "toronto"],
  [22, 6, "16:00", "dallas"],
  [23, 6, "13:00", "houston"],
  [24, 6, "22:00", "mexico-city"],
  [25, 7, "12:00", "atlanta"],
  [26, 7, "15:00", "los-angeles"],
  [27, 7, "18:00", "vancouver"],
  [28, 7, "21:00", "guadalajara"],
  [29, 8, "20:30", "philadelphia"],
  [30, 8, "18:00", "boston"],
  [31, 8, "23:00", "san-francisco-bay-area"],
  [32, 8, "15:00", "seattle"],
  [33, 9, "16:00", "toronto"],
  [34, 9, "20:00", "kansas-city"],
  [35, 9, "13:00", "houston"],
  [36, 9, "00:00", "monterrey"],
  [37, 10, "18:00", "miami"],
  [38, 10, "12:00", "atlanta"],
  [39, 10, "15:00", "los-angeles"],
  [40, 10, "21:00", "vancouver"],
  [41, 11, "20:00", "new-york-new-jersey"],
  [42, 11, "17:00", "philadelphia"],
  [43, 11, "13:00", "dallas"],
  [44, 11, "23:00", "san-francisco-bay-area"],
  [45, 12, "16:00", "boston"],
  [46, 12, "19:00", "toronto"],
  [47, 12, "13:00", "houston"],
  [48, 12, "22:00", "guadalajara"],
  [49, 13, "18:00", "miami"],
  [50, 13, "18:00", "atlanta"],
  [51, 13, "15:00", "vancouver"],
  [52, 13, "15:00", "seattle"],
  [53, 13, "21:00", "mexico-city"],
  [54, 13, "21:00", "monterrey"],
  [55, 14, "16:00", "philadelphia"],
  [56, 14, "16:00", "new-york-new-jersey"],
  [57, 14, "19:00", "dallas"],
  [58, 14, "19:00", "kansas-city"],
  [59, 14, "22:00", "los-angeles"],
  [60, 14, "22:00", "san-francisco-bay-area"],
  [61, 15, "15:00", "boston"],
  [62, 15, "15:00", "toronto"],
  [63, 15, "23:00", "seattle"],
  [64, 15, "23:00", "vancouver"],
  [65, 15, "20:00", "houston"],
  [66, 15, "20:00", "guadalajara"],
  [67, 16, "17:00", "new-york-new-jersey"],
  [68, 16, "17:00", "philadelphia"],
  [69, 16, "22:00", "kansas-city"],
  [70, 16, "22:00", "dallas"],
  [71, 16, "19:30", "miami"],
  [72, 16, "19:30", "atlanta"],
  [73, 17, "15:00", "los-angeles"],
  [74, 18, "16:30", "boston"],
  [75, 18, "21:00", "monterrey"],
  [76, 18, "13:00", "houston"],
  [77, 19, "17:00", "new-york-new-jersey"],
  [78, 19, "13:00", "dallas"],
  [79, 19, "21:00", "mexico-city"],
  [80, 20, "12:00", "atlanta"],
  [81, 20, "20:00", "san-francisco-bay-area"],
  [82, 20, "16:00", "seattle"],
  [83, 21, "19:00", "toronto"],
  [84, 21, "15:00", "los-angeles"],
  [85, 21, "23:00", "vancouver"],
  [86, 22, "18:00", "miami"],
  [87, 22, "21:30", "kansas-city"],
  [88, 22, "14:00", "dallas"],
  [89, 23, "17:00", "philadelphia"],
  [90, 23, "13:00", "houston"],
  [91, 24, "16:00", "new-york-new-jersey"],
  [92, 24, "20:00", "mexico-city"],
  [93, 25, "15:00", "dallas"],
  [94, 25, "20:00", "seattle"],
  [95, 26, "12:00", "atlanta"],
  [96, 26, "16:00", "vancouver"],
  [97, 28, "16:00", "boston"],
  [98, 29, "15:00", "los-angeles"],
  [99, 30, "17:00", "miami"],
  [100, 30, "21:00", "kansas-city"],
  [101, 33, "15:00", "dallas"],
  [102, 34, "15:00", "atlanta"],
  [103, 37, "17:00", "miami"],
  [104, 38, "15:00", "new-york-new-jersey"],
] as const satisfies readonly OfficialScheduleEntry[];

const schedulesByMatchNumber = new Map(
  officialSchedule.map((entry) => [entry[0], entry]),
);

const groupIdsByTeamId = new Map<TeamId, GroupId>(
  fifaWorldCup2026Groups.flatMap((group) =>
    group.teamIds.map((teamId) => [teamId, group.id] as const),
  ),
);

export const fifaWorldCup2026Matches = officialResults.map(
  (result): Match => {
    const [
      matchNumber,
      homeTeamId,
      awayTeamId,
      homeGoals,
      awayGoals,
      decision = "regular_time",
      homePenalties,
      awayPenalties,
    ] = result;
    const schedule = schedulesByMatchNumber.get(matchNumber);

    if (!schedule) {
      throw new Error(`Missing official schedule for match ${matchNumber}`);
    }

    const [, dayOffset, easternTime, venueId] = schedule;
    const stage = getStage(matchNumber);
    const groupId =
      stage === "group" ? groupIdsByTeamId.get(homeTeamId) : undefined;

    if (stage === "group" && !groupId) {
      throw new Error(`Missing group for match ${matchNumber}`);
    }

    if (
      decision === "penalties" &&
      (homePenalties === undefined || awayPenalties === undefined)
    ) {
      throw new Error(`Missing penalty score for match ${matchNumber}`);
    }

    return {
      id: `match-${matchNumber}`,
      matchNumber,
      stage,
      ...(groupId ? { groupId } : {}),
      home: { type: "team", teamId: homeTeamId },
      away: { type: "team", teamId: awayTeamId },
      kickoffAt: toEasternIsoDateTime(dayOffset, easternTime),
      venueId,
      status: "completed",
      score:
        decision === "penalties"
          ? {
              fullTime: { home: homeGoals, away: awayGoals },
              decidedBy: decision,
              penalties: {
                home: homePenalties as number,
                away: awayPenalties as number,
              },
            }
          : {
              fullTime: { home: homeGoals, away: awayGoals },
              decidedBy: decision,
            },
    };
  },
);

function getStage(matchNumber: number): MatchStage {
  if (matchNumber <= 72) return "group";
  if (matchNumber <= 88) return "round_of_32";
  if (matchNumber <= 96) return "round_of_16";
  if (matchNumber <= 100) return "quarter_final";
  if (matchNumber <= 102) return "semi_final";
  if (matchNumber === 103) return "third_place";
  return "final";
}

function toEasternIsoDateTime(dayOffset: number, easternTime: string) {
  const date = new Date(Date.UTC(2026, 5, 11 + dayOffset))
    .toISOString()
    .slice(0, 10);

  return `${date}T${easternTime}:00-04:00`;
}
