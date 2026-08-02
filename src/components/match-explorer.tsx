"use client";

import { useId, useMemo, useState } from "react";

import type {
  Match,
  MatchStage,
  TournamentSnapshot,
} from "@/domain/tournament/types";

type StageFilter = "all" | MatchStage;

const stageOptions: readonly {
  value: StageFilter;
  label: string;
  shortLabel: string;
}[] = [
  { value: "all", label: "All matches", shortLabel: "All" },
  { value: "group", label: "Group stage", shortLabel: "Groups" },
  { value: "round_of_32", label: "Round of 32", shortLabel: "R32" },
  { value: "round_of_16", label: "Round of 16", shortLabel: "R16" },
  { value: "quarter_final", label: "Quarter-finals", shortLabel: "QF" },
  { value: "semi_final", label: "Semi-finals", shortLabel: "SF" },
  { value: "third_place", label: "Third place", shortLabel: "3rd" },
  { value: "final", label: "Final", shortLabel: "Final" },
];

type MatchExplorerProps = Readonly<{
  snapshot: TournamentSnapshot;
}>;

export function MatchExplorer({ snapshot }: MatchExplorerProps) {
  const [selectedStage, setSelectedStage] = useState<StageFilter>("all");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const groupFilterId = useId();
  const teamsById = useMemo(
    () => new Map(snapshot.teams.map((team) => [team.id, team])),
    [snapshot.teams],
  );
  const venuesById = useMemo(
    () => new Map(snapshot.venues.map((venue) => [venue.id, venue])),
    [snapshot.venues],
  );
  const stageCounts = useMemo(
    () =>
      new Map<StageFilter, number>([
        ["all", snapshot.matches.length],
        ...stageOptions
          .filter((option) => option.value !== "all")
          .map(
            (option) =>
              [
                option.value,
                snapshot.matches.filter(
                  (match) => match.stage === option.value,
                ).length,
              ] as const,
          ),
      ]),
    [snapshot.matches],
  );

  const filteredMatches = snapshot.matches.filter((match) => {
    const matchesStage =
      selectedStage === "all" || match.stage === selectedStage;
    const matchesGroup =
      selectedGroup === "all" || match.groupId === selectedGroup;

    return matchesStage && matchesGroup;
  });

  function selectStage(stage: StageFilter) {
    setSelectedStage(stage);
    if (stage !== "all" && stage !== "group") {
      setSelectedGroup("all");
    }
  }

  function selectGroup(groupId: string) {
    setSelectedGroup(groupId);
    if (groupId !== "all") {
      setSelectedStage("group");
    }
  }

  return (
    <section
      aria-labelledby="match-explorer-title"
      className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8 sm:pb-28"
    >
      <div className="rounded-[2rem] border border-line bg-surface/85 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-line px-1 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-highlight">
              Road to the final
            </p>
            <h2
              className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
              id="match-explorer-title"
            >
              Match explorer
            </h2>
          </div>

          <div className="min-w-48">
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-secondary"
              htmlFor={groupFilterId}
            >
              Group filter
            </label>
            <select
              className="w-full rounded-xl border border-line bg-stadium px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-highlight focus:ring-2 focus:ring-highlight/20"
              id={groupFilterId}
              onChange={(event) => selectGroup(event.target.value)}
              value={selectedGroup}
            >
              <option value="all">All groups</option>
              {snapshot.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ol
          aria-label="Tournament stage filter"
          className="journey-track mt-6 grid grid-cols-4 gap-x-2 gap-y-5 lg:grid-cols-8"
        >
          {stageOptions.map((option, index) => {
            const isSelected = selectedStage === option.value;
            const matchCount = stageCounts.get(option.value) ?? 0;

            return (
              <li className="relative z-10" key={option.value}>
                <button
                  aria-label={option.label}
                  aria-pressed={isSelected}
                  className="group flex w-full flex-col items-center gap-2 text-center"
                  onClick={() => selectStage(option.value)}
                  type="button"
                >
                  <span
                    className={`journey-marker ${isSelected ? "journey-marker-active" : ""}`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`text-xs font-semibold transition sm:text-sm ${isSelected ? "text-foreground" : "text-secondary group-hover:text-foreground"}`}
                  >
                    <span className="hidden sm:inline">{option.label}</span>
                    <span className="sm:hidden">{option.shortLabel}</span>
                  </span>
                  <span aria-hidden="true" className="text-xs text-secondary/70">
                    {matchCount}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="font-medium">
          {filteredMatches.length} {filteredMatches.length === 1 ? "match" : "matches"}{" "}
          shown
        </p>
        <p className="text-sm text-secondary">
          Select a stage or group to narrow the journey.
        </p>
      </div>

      {filteredMatches.length > 0 ? (
        <ol
          aria-label="Match results"
          className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredMatches.map((match) => {
            const homeTeam =
              match.home.type === "team"
                ? teamsById.get(match.home.teamId)
                : undefined;
            const awayTeam =
              match.away.type === "team"
                ? teamsById.get(match.away.teamId)
                : undefined;
            const venue = match.venueId
              ? venuesById.get(match.venueId)
              : undefined;
            const winnerTeamId = getWinnerTeamId(match);

            if (!homeTeam || !awayTeam) return null;

            return (
              <li key={match.id}>
                <article className="match-card h-full overflow-hidden rounded-2xl border border-line bg-surface-raised">
                  <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 text-xs text-secondary">
                    <p className="font-semibold uppercase tracking-[0.12em]">
                      Match {match.matchNumber}
                    </p>
                    <p>{getStageLabel(match, snapshot)}</p>
                  </header>

                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-secondary">
                      {formatKickoff(
                        match.kickoffAt,
                        snapshot.tournament.displayTimeZone,
                      )}
                    </p>

                    <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3">
                      <Team
                        isWinner={winnerTeamId === homeTeam.id}
                        team={homeTeam}
                      />
                      <Score
                        isWinner={winnerTeamId === homeTeam.id}
                        value={match.score?.fullTime.home}
                      />
                      <Team
                        isWinner={winnerTeamId === awayTeam.id}
                        team={awayTeam}
                      />
                      <Score
                        isWinner={winnerTeamId === awayTeam.id}
                        value={match.score?.fullTime.away}
                      />
                    </div>

                    {match.score?.decidedBy === "extra_time" ? (
                      <ResultNote>After extra time</ResultNote>
                    ) : null}
                    {match.score?.decidedBy === "penalties" &&
                    match.score.penalties ? (
                      <ResultNote>
                        {getPenaltyWinner(match, homeTeam.name, awayTeam.name)} win{" "}
                        {Math.max(
                          match.score.penalties.home,
                          match.score.penalties.away,
                        )}
                        –
                        {Math.min(
                          match.score.penalties.home,
                          match.score.penalties.away,
                        )}{" "}
                        on penalties
                      </ResultNote>
                    ) : null}

                    <p className="mt-5 border-t border-line pt-3 text-sm text-secondary">
                      {venue?.name ?? "Venue to be confirmed"}
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-line px-6 py-14 text-center text-secondary">
          No matches are available for this route.
        </div>
      )}
    </section>
  );
}

function Team({
  isWinner,
  team,
}: Readonly<{
  isWinner: boolean;
  team: TournamentSnapshot["teams"][number];
}>) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-full border text-[0.65rem] font-bold tracking-wide transition ${isWinner ? "border-highlight bg-highlight text-stadium shadow-[0_0_16px_color-mix(in_oklch,var(--highlight)_25%,transparent)]" : "border-line bg-stadium text-highlight"}`}
      >
        {team.code}
      </span>
      <span
        className={`truncate font-semibold ${isWinner ? "text-highlight" : ""}`}
      >
        {team.name}
      </span>
      {isWinner ? (
        <span className="shrink-0 rounded-full border border-highlight/35 bg-highlight/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-highlight">
          Winner
        </span>
      ) : null}
    </div>
  );
}

function Score({
  isWinner,
  value,
}: Readonly<{ isWinner: boolean; value: number | undefined }>) {
  return (
    <span
      className={`min-w-9 text-right text-2xl font-semibold tabular-nums ${isWinner ? "text-highlight" : ""}`}
    >
      {value ?? "–"}
    </span>
  );
}

function ResultNote({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="mt-4 rounded-lg bg-highlight/10 px-3 py-2 text-xs font-semibold text-highlight">
      {children}
    </p>
  );
}

function getStageLabel(match: Match, snapshot: TournamentSnapshot) {
  if (match.groupId) {
    return (
      snapshot.groups.find((group) => group.id === match.groupId)?.name ??
      "Group stage"
    );
  }

  return (
    stageOptions.find((option) => option.value === match.stage)?.label ??
    match.stage
  );
}

function getPenaltyWinner(
  match: Match,
  homeTeamName: string,
  awayTeamName: string,
) {
  if (!match.score?.penalties) return "";
  return match.score.penalties.home > match.score.penalties.away
    ? homeTeamName
    : awayTeamName;
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

function formatKickoff(kickoffAt: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(kickoffAt));
}
