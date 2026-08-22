"use client";

import { useId, useMemo, useRef, useState } from "react";

import type {
  Match,
  MatchStage,
  Team,
  TeamId,
  TournamentSnapshot,
} from "@/domain/tournament/types";

import { TeamFlag } from "./team-flag";

type KnockoutBracketViewProps = Readonly<{
  onSelectMatch: (matchId: string, trigger: HTMLButtonElement) => void;
  selectedMatchId: string | undefined;
  snapshot: TournamentSnapshot;
}>;

type MainBracketStage =
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "final";

type IncomingPath = "top" | "bottom" | undefined;

interface BracketRound {
  readonly stage: MainBracketStage;
  readonly label: string;
  readonly shortLabel: string;
  readonly matches: readonly Match[];
}

const mainBracketStages: readonly MainBracketStage[] = [
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "final",
];

const roundLabels: Record<
  MainBracketStage,
  { readonly label: string; readonly shortLabel: string }
> = {
  round_of_32: { label: "Round of 32", shortLabel: "R32" },
  round_of_16: { label: "Round of 16", shortLabel: "R16" },
  quarter_final: { label: "Quarter-finals", shortLabel: "QF" },
  semi_final: { label: "Semi-finals", shortLabel: "SF" },
  final: { label: "Final", shortLabel: "Final" },
};

export function KnockoutBracketView({
  onSelectMatch,
  selectedMatchId,
  snapshot,
}: KnockoutBracketViewProps) {
  const bracketScrollRef = useRef<HTMLDivElement>(null);
  const followedTeamId = useId();
  const bracket = useMemo(() => buildBracket(snapshot.matches), [snapshot.matches]);
  const teamsById = useMemo(
    () => new Map(snapshot.teams.map((team) => [team.id, team])),
    [snapshot.teams],
  );
  const knockoutTeams = useMemo(
    () => getKnockoutTeams(bracket.rounds[0]?.matches ?? [], teamsById),
    [bracket.rounds, teamsById],
  );
  const championTeamId = bracket.finalMatch
    ? getWinnerTeamId(bracket.finalMatch)
    : undefined;
  const [trackedTeamId, setTrackedTeamId] = useState<TeamId | undefined>(
    championTeamId,
  );
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const trackedTeam = trackedTeamId
    ? teamsById.get(trackedTeamId)
    : undefined;
  const trackedMatchCount = trackedTeamId
    ? [...bracket.rounds.flatMap((round) => round.matches), bracket.thirdPlaceMatch]
        .filter((match): match is Match => match !== undefined)
        .filter((match) => matchIncludesTeam(match, trackedTeamId)).length
    : 0;

  if (!bracket.finalMatch || bracket.rounds.some((round) => round.matches.length === 0)) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-line px-6 py-14 text-center text-secondary">
        The knockout bracket is not available for this tournament.
      </div>
    );
  }

  function selectRound(index: number) {
    setSelectedRoundIndex(index);
    const container = bracketScrollRef.current;
    const target = container?.querySelector<HTMLElement>(
      `[data-round-index="${index}"]`,
    );

    if (container && target) {
      container.scrollTo?.({
        behavior: "smooth",
        left: Math.max(0, target.offsetLeft - 16),
      });
    }
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-highlight">
            Knockout highway
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Every turn on the road to the trophy
          </h3>
          <p className="mt-3 text-sm leading-6 text-secondary sm:text-base">
            Follow a team through the connected bracket, inspect every result,
            and trace the route from the Round of 32 to the final.
          </p>
        </div>

        <label className="block min-w-56" htmlFor={followedTeamId}>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
            Follow a team
          </span>
          <select
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-highlight focus:ring-2 focus:ring-highlight/20"
            id={followedTeamId}
            onChange={(event) => setTrackedTeamId(event.target.value)}
            value={trackedTeamId ?? ""}
          >
            {knockoutTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface/75 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {trackedTeam ? <TeamFlag highlighted size="medium" team={trackedTeam} /> : null}
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {trackedTeam?.name ?? "Choose a team"}
            </p>
            <p className="mt-0.5 text-sm text-secondary">
              {getTrackedTeamSummary(
                trackedTeamId,
                championTeamId,
                bracket.thirdPlaceMatch,
              )}{" "}
              · {trackedMatchCount} knockout matches
            </p>
          </div>
        </div>

        <div
          aria-label="Bracket round navigation"
          className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-stadium p-1"
          role="group"
        >
          {bracket.rounds.map((round, index) => (
            <button
              aria-pressed={selectedRoundIndex === index}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${selectedRoundIndex === index ? "bg-highlight text-stadium" : "text-secondary hover:text-foreground"}`}
              key={round.stage}
              onClick={() => selectRound(index)}
              type="button"
            >
              <span className="hidden sm:inline">{round.label}</span>
              <span className="sm:hidden">{round.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        aria-label="Connected knockout bracket"
        className="knockout-scroll mt-5 overflow-x-auto rounded-3xl border border-line bg-surface/55 p-4 shadow-2xl shadow-black/15 sm:p-6"
        ref={bracketScrollRef}
        role="region"
        tabIndex={0}
      >
        <div className="knockout-round-headings">
          {bracket.rounds.map((round, index) => (
            <div
              className="rounded-xl border border-line bg-stadium/85 px-4 py-3"
              data-round-index={index}
              key={round.stage}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-highlight">
                {round.label}
              </p>
              <p className="mt-1 text-xs text-secondary">
                {round.matches.length}{" "}
                {round.matches.length === 1 ? "match" : "matches"}
              </p>
            </div>
          ))}
        </div>

        <ol aria-label="Knockout bracket matches" className="knockout-bracket-grid mt-4">
          {bracket.rounds.flatMap((round, roundIndex) => {
            const slotSpan = 2 ** (roundIndex + 1);
            const nextRound = bracket.rounds[roundIndex + 1];

            return round.matches.map((match, matchIndex) => {
              const incomingPath = getIncomingPath(match, trackedTeamId);
              const advancesOnTrackedPath =
                trackedTeamId !== undefined &&
                getWinnerTeamId(match) === trackedTeamId &&
                (nextRound?.matches.some((nextMatch) =>
                  matchIncludesTeam(nextMatch, trackedTeamId),
                ) ?? false);
              const isOnTrackedPath =
                trackedTeamId !== undefined &&
                matchIncludesTeam(match, trackedTeamId);

              return (
                <li
                  className={`knockout-slot ${roundIndex > 0 ? "knockout-slot-incoming" : ""}`}
                  key={match.id}
                  style={{
                    gridColumn: roundIndex + 1,
                    gridRow: `${matchIndex * slotSpan + 1} / span ${slotSpan}`,
                  }}
                >
                  {roundIndex > 0 && incomingPath ? (
                    <span
                      aria-hidden="true"
                      className={`knockout-connector-highlight knockout-connector-${incomingPath}`}
                    />
                  ) : null}
                  <BracketMatchCard
                    hasOutput={roundIndex < bracket.rounds.length - 1}
                    isOnTrackedPath={isOnTrackedPath}
                    isOutputHighlighted={advancesOnTrackedPath}
                    isSelected={selectedMatchId === match.id}
                    match={match}
                    onSelectMatch={onSelectMatch}
                    teamsById={teamsById}
                    trackedTeamId={trackedTeamId}
                  />
                </li>
              );
            });
          })}
        </ol>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {bracket.thirdPlaceMatch ? (
          <section
            aria-labelledby="third-place-match-title"
            className="rounded-3xl border border-line bg-surface/80 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-highlight">
              Bronze route
            </p>
            <h4 className="mt-1 text-xl font-semibold" id="third-place-match-title">
              Third-place match
            </h4>
            <div className="mt-4 max-w-md">
              <BracketMatchCard
                hasOutput={false}
                isOnTrackedPath={
                  trackedTeamId !== undefined &&
                  matchIncludesTeam(bracket.thirdPlaceMatch, trackedTeamId)
                }
                isOutputHighlighted={false}
                isSelected={selectedMatchId === bracket.thirdPlaceMatch.id}
                match={bracket.thirdPlaceMatch}
                onSelectMatch={onSelectMatch}
                teamsById={teamsById}
                trackedTeamId={trackedTeamId}
              />
            </div>
          </section>
        ) : null}

        <ChampionCard
          championTeamId={championTeamId}
          finalMatch={bracket.finalMatch}
          teamsById={teamsById}
        />
      </div>
    </div>
  );
}

function BracketMatchCard({
  hasOutput,
  isOnTrackedPath,
  isOutputHighlighted,
  isSelected,
  match,
  onSelectMatch,
  teamsById,
  trackedTeamId,
}: Readonly<{
  hasOutput: boolean;
  isOnTrackedPath: boolean;
  isOutputHighlighted: boolean;
  isSelected: boolean;
  match: Match;
  onSelectMatch: KnockoutBracketViewProps["onSelectMatch"];
  teamsById: ReadonlyMap<TeamId, Team>;
  trackedTeamId: TeamId | undefined;
}>) {
  const homeTeam =
    match.home.type === "team" ? teamsById.get(match.home.teamId) : undefined;
  const awayTeam =
    match.away.type === "team" ? teamsById.get(match.away.teamId) : undefined;
  const winnerTeamId = getWinnerTeamId(match);

  if (!homeTeam || !awayTeam) return null;

  return (
    <article
      className={`knockout-match-card w-full ${hasOutput ? "knockout-match-card-output" : ""} ${isOutputHighlighted ? "knockout-match-card-output-path" : ""}`}
    >
      <button
        aria-label={`View bracket details for Match ${match.matchNumber}: ${homeTeam.name} versus ${awayTeam.name}`}
        className={`relative z-10 w-full overflow-hidden rounded-2xl border bg-surface-raised text-left shadow-xl shadow-black/20 outline-none transition hover:-translate-y-0.5 hover:border-highlight/50 focus-visible:ring-2 focus-visible:ring-highlight ${isOnTrackedPath ? "border-highlight/60 ring-2 ring-highlight/15" : "border-line"} ${isSelected ? "border-highlight ring-2 ring-highlight/40" : ""}`}
        onClick={(event) => onSelectMatch(match.id, event.currentTarget)}
        type="button"
      >
        <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-secondary">
          <span>Match {match.matchNumber}</span>
          <span>{getDecisionLabel(match)}</span>
        </header>
        <div className="space-y-1.5 p-2.5">
          <BracketTeamRow
            isTracked={homeTeam.id === trackedTeamId}
            isWinner={winnerTeamId === homeTeam.id}
            score={match.score?.fullTime.home}
            team={homeTeam}
          />
          <BracketTeamRow
            isTracked={awayTeam.id === trackedTeamId}
            isWinner={winnerTeamId === awayTeam.id}
            score={match.score?.fullTime.away}
            team={awayTeam}
          />
          {match.score?.decidedBy === "penalties" && match.score.penalties ? (
            <p className="px-1 pt-0.5 text-[0.65rem] font-semibold text-highlight">
              Penalties {match.score.penalties.home}–{match.score.penalties.away}
            </p>
          ) : null}
        </div>
      </button>
    </article>
  );
}

function BracketTeamRow({
  isTracked,
  isWinner,
  score,
  team,
}: Readonly<{
  isTracked: boolean;
  isWinner: boolean;
  score: number | undefined;
  team: Team;
}>) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-1.5 py-1 ${isWinner ? "bg-highlight/10" : ""}`}
    >
      <TeamFlag highlighted={isWinner} size="small" team={team} />
      <span
        className={`min-w-0 flex-1 truncate text-sm font-semibold ${isWinner ? "text-highlight" : isTracked ? "text-foreground" : "text-secondary"}`}
      >
        {team.shortName}
      </span>
      {isWinner ? (
        <span className="text-[0.58rem] font-bold uppercase tracking-[0.08em] text-highlight">
          W
        </span>
      ) : null}
      <span
        className={`min-w-5 text-right font-bold tabular-nums ${isWinner ? "text-highlight" : "text-foreground"}`}
      >
        {score ?? "–"}
      </span>
    </div>
  );
}

function ChampionCard({
  championTeamId,
  finalMatch,
  teamsById,
}: Readonly<{
  championTeamId: TeamId | undefined;
  finalMatch: Match;
  teamsById: ReadonlyMap<TeamId, Team>;
}>) {
  const champion = championTeamId ? teamsById.get(championTeamId) : undefined;

  return (
    <section
      aria-labelledby="champion-card-title"
      className="relative overflow-hidden rounded-3xl border border-highlight/40 bg-highlight/10 p-5"
    >
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-14 text-[10rem] font-black leading-none text-highlight/[0.055]"
      >
        26
      </div>
      <p className="relative text-xs font-semibold uppercase tracking-[0.16em] text-highlight">
        Road completed
      </p>
      <h4 className="relative mt-1 text-xl font-semibold" id="champion-card-title">
        Tournament champion
      </h4>
      <div className="relative mt-5 flex items-center gap-4">
        {champion ? <TeamFlag highlighted size="large" team={champion} /> : null}
        <div>
          <p className="text-2xl font-semibold tracking-tight">
            {champion?.name ?? "To be confirmed"}
          </p>
          <p className="mt-1 text-sm text-secondary">
            Match {finalMatch.matchNumber} · {getDecisionLabel(finalMatch)}
          </p>
        </div>
      </div>
    </section>
  );
}

function buildBracket(matches: readonly Match[]) {
  const matchesByStage = new Map<MatchStage, Match[]>(
    mainBracketStages.map((stage) => [
      stage,
      matches.filter((match) => match.stage === stage),
    ]),
  );
  const finalMatch = matchesByStage.get("final")?.[0];

  if (!finalMatch) {
    return {
      finalMatch: undefined,
      rounds: [] as readonly BracketRound[],
      thirdPlaceMatch: matches.find((match) => match.stage === "third_place"),
    };
  }

  const roundsFromFinal: Match[][] = [[finalMatch]];

  for (let index = mainBracketStages.length - 2; index >= 0; index -= 1) {
    const stage = mainBracketStages[index];
    const stagePool = matchesByStage.get(stage) ?? [];
    const nextRoundMatches = roundsFromFinal[0];
    const orderedMatches = nextRoundMatches.flatMap((nextMatch) =>
      getPredecessors(nextMatch, stagePool),
    );
    const uniqueOrderedMatches = [...new Map(orderedMatches.map((match) => [match.id, match])).values()];

    roundsFromFinal.unshift(
      uniqueOrderedMatches.length === stagePool.length
        ? uniqueOrderedMatches
        : [...stagePool].sort((left, right) => left.matchNumber - right.matchNumber),
    );
  }

  return {
    finalMatch,
    rounds: mainBracketStages.map((stage, index) => ({
      stage,
      ...roundLabels[stage],
      matches: roundsFromFinal[index],
    })),
    thirdPlaceMatch: matches.find((match) => match.stage === "third_place"),
  };
}

function getPredecessors(match: Match, stagePool: readonly Match[]) {
  return [match.home, match.away].flatMap((participant) => {
    if (participant.type !== "team") return [];
    const predecessor = stagePool.find(
      (candidate) => getWinnerTeamId(candidate) === participant.teamId,
    );
    return predecessor ? [predecessor] : [];
  });
}

function getKnockoutTeams(
  openingRound: readonly Match[],
  teamsById: ReadonlyMap<TeamId, Team>,
) {
  const teamIds = new Set<TeamId>();
  openingRound.forEach((match) => {
    if (match.home.type === "team") teamIds.add(match.home.teamId);
    if (match.away.type === "team") teamIds.add(match.away.teamId);
  });

  return [...teamIds]
    .flatMap((teamId) => {
      const team = teamsById.get(teamId);
      return team ? [team] : [];
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function getIncomingPath(
  match: Match,
  trackedTeamId: TeamId | undefined,
): IncomingPath {
  if (!trackedTeamId) return undefined;
  if (match.home.type === "team" && match.home.teamId === trackedTeamId) {
    return "top";
  }
  if (match.away.type === "team" && match.away.teamId === trackedTeamId) {
    return "bottom";
  }
  return undefined;
}

function getTrackedTeamSummary(
  trackedTeamId: TeamId | undefined,
  championTeamId: TeamId | undefined,
  thirdPlaceMatch: Match | undefined,
) {
  if (!trackedTeamId) return "Knockout route";
  if (trackedTeamId === championTeamId) return "Champion route";
  if (thirdPlaceMatch && getWinnerTeamId(thirdPlaceMatch) === trackedTeamId) {
    return "Third-place route";
  }
  return "Knockout route";
}

function matchIncludesTeam(match: Match, teamId: TeamId) {
  return (
    (match.home.type === "team" && match.home.teamId === teamId) ||
    (match.away.type === "team" && match.away.teamId === teamId)
  );
}

function getDecisionLabel(match: Match) {
  switch (match.score?.decidedBy) {
    case "extra_time":
      return "AET";
    case "penalties":
      return "PEN";
    default:
      return "FT";
  }
}

function getWinnerTeamId(match: Match) {
  if (
    match.home.type !== "team" ||
    match.away.type !== "team" ||
    !match.score
  ) {
    return undefined;
  }

  const decidingScore =
    match.score.decidedBy === "penalties"
      ? match.score.penalties
      : match.score.fullTime;

  if (!decidingScore || decidingScore.home === decidingScore.away) {
    return undefined;
  }

  return decidingScore.home > decidingScore.away
    ? match.home.teamId
    : match.away.teamId;
}
