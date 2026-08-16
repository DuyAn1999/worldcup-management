"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  Match,
  MatchStage,
  Team as TeamType,
  TournamentSnapshot,
  Venue,
} from "@/domain/tournament/types";

import { MatchEventTimeline } from "./match-event-timeline";
import { MatchTeamSheetView } from "./match-team-sheet";
import { TeamFlag } from "./team-flag";

type StageFilter = "all" | MatchStage;
type MatchDetailsTab = "overview" | "events" | "lineups";

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
  const [selectedMatchId, setSelectedMatchId] = useState<string>();
  const groupFilterId = useId();
  const returnFocusRef = useRef<HTMLButtonElement>(null);
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

  const filteredMatches = useMemo(
    () =>
      snapshot.matches.filter((match) =>
        matchesFilters(match, selectedStage, selectedGroup),
      ),
    [selectedGroup, selectedStage, snapshot.matches],
  );
  const selectedMatch = selectedMatchId
    ? snapshot.matches.find((match) => match.id === selectedMatchId)
    : undefined;
  const selectedHomeTeam =
    selectedMatch?.home.type === "team"
      ? teamsById.get(selectedMatch.home.teamId)
      : undefined;
  const selectedAwayTeam =
    selectedMatch?.away.type === "team"
      ? teamsById.get(selectedMatch.away.teamId)
      : undefined;
  const selectedVenue = selectedMatch?.venueId
    ? venuesById.get(selectedMatch.venueId)
    : undefined;
  const selectedHomeTeamSheet =
    selectedMatch && selectedHomeTeam
      ? snapshot.teamSheets.find(
          (teamSheet) =>
            teamSheet.matchId === selectedMatch.id &&
            teamSheet.teamId === selectedHomeTeam.id,
        )
      : undefined;
  const selectedAwayTeamSheet =
    selectedMatch && selectedAwayTeam
      ? snapshot.teamSheets.find(
          (teamSheet) =>
            teamSheet.matchId === selectedMatch.id &&
            teamSheet.teamId === selectedAwayTeam.id,
        )
      : undefined;
  const selectedMatchEvents = selectedMatch
    ? snapshot.matchEvents.filter(
        (matchEvent) => matchEvent.matchId === selectedMatch.id,
      )
    : [];

  const closeDetails = useCallback(() => {
    setSelectedMatchId(undefined);
    returnFocusRef.current?.focus();
  }, []);

  function selectStage(stage: StageFilter) {
    const nextGroup = stage !== "all" && stage !== "group" ? "all" : selectedGroup;
    setSelectedStage(stage);
    setSelectedGroup(nextGroup);
    if (selectedMatch && !matchesFilters(selectedMatch, stage, nextGroup)) {
      setSelectedMatchId(undefined);
    }
  }

  function selectGroup(groupId: string) {
    const nextStage = groupId !== "all" ? "group" : selectedStage;
    setSelectedGroup(groupId);
    setSelectedStage(nextStage);
    if (selectedMatch && !matchesFilters(selectedMatch, nextStage, groupId)) {
      setSelectedMatchId(undefined);
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
            const isSelected = match.id === selectedMatchId;

            if (!homeTeam || !awayTeam) return null;

            return (
              <li key={match.id}>
                <article
                  className={`match-card h-full overflow-hidden rounded-2xl border bg-surface-raised ${isSelected ? "match-card-selected border-highlight" : "border-line"}`}
                >
                  <button
                    aria-expanded={isSelected}
                    aria-haspopup="dialog"
                    aria-label={`View details for Match ${match.matchNumber}: ${homeTeam.name} versus ${awayTeam.name}`}
                    className="block h-full w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-inset"
                    onClick={(event) => {
                      returnFocusRef.current = event.currentTarget;
                      setSelectedMatchId(match.id);
                    }}
                    type="button"
                  >
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
                          {getPenaltyWinner(
                            match,
                            homeTeam.name,
                            awayTeam.name,
                          )}{" "}
                          win {Math.max(
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
                  </button>
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

      {selectedMatch && selectedHomeTeam && selectedAwayTeam ? (
        <MatchDetailsPanel
          awayTeam={selectedAwayTeam}
          awayTeamSheet={selectedAwayTeamSheet}
          displayTimeZone={snapshot.tournament.displayTimeZone}
          homeTeam={selectedHomeTeam}
          homeTeamSheet={selectedHomeTeamSheet}
          key={selectedMatch.id}
          match={selectedMatch}
          matchEvents={selectedMatchEvents}
          onClose={closeDetails}
          players={snapshot.players}
          stageLabel={getStageLabel(selectedMatch, snapshot)}
          venue={selectedVenue}
        />
      ) : null}
    </section>
  );
}

function MatchDetailsPanel({
  awayTeam,
  awayTeamSheet,
  displayTimeZone,
  homeTeam,
  homeTeamSheet,
  match,
  matchEvents,
  onClose,
  players,
  stageLabel,
  venue,
}: Readonly<{
  awayTeam: TeamType;
  awayTeamSheet: TournamentSnapshot["teamSheets"][number] | undefined;
  displayTimeZone: string;
  homeTeam: TeamType;
  homeTeamSheet: TournamentSnapshot["teamSheets"][number] | undefined;
  match: Match;
  matchEvents: TournamentSnapshot["matchEvents"];
  onClose: () => void;
  players: TournamentSnapshot["players"];
  stageLabel: string;
  venue: Venue | undefined;
}>) {
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const overviewTabId = useId();
  const overviewPanelId = useId();
  const eventsTabId = useId();
  const eventsPanelId = useId();
  const lineupsTabId = useId();
  const lineupsPanelId = useId();
  const [activeTab, setActiveTab] = useState<MatchDetailsTab>("overview");
  const winnerTeamId = getWinnerTeamId(match);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="match-details-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/75 sm:p-6 lg:items-stretch lg:justify-end"
      data-testid="match-details-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="match-details-panel max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] border border-line bg-surface-raised shadow-2xl shadow-black/40 sm:max-w-2xl sm:rounded-[2rem] lg:h-full lg:max-h-none"
        ref={panelRef}
        role="dialog"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-surface-raised/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-highlight">
              {stageLabel}
            </p>
            <h2 className="mt-1 text-xl font-semibold" id={titleId}>
              Match {match.matchNumber} details
            </h2>
          </div>
          <button
            aria-label="Close match details"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-stadium text-xl text-secondary transition hover:border-highlight hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="border-b border-line px-5 sm:px-7">
          <div aria-label="Match details sections" className="flex gap-6" role="tablist">
            <button
              aria-controls={overviewPanelId}
              aria-selected={activeTab === "overview"}
              className={`border-b-2 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight ${activeTab === "overview" ? "border-highlight text-highlight" : "border-transparent text-secondary hover:text-foreground"}`}
              id={overviewTabId}
              onClick={() => setActiveTab("overview")}
              role="tab"
              type="button"
            >
              Overview
            </button>
            <button
              aria-controls={eventsPanelId}
              aria-selected={activeTab === "events"}
              className={`border-b-2 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight ${activeTab === "events" ? "border-highlight text-highlight" : "border-transparent text-secondary hover:text-foreground"}`}
              id={eventsTabId}
              onClick={() => setActiveTab("events")}
              role="tab"
              type="button"
            >
              Events
            </button>
            <button
              aria-controls={lineupsPanelId}
              aria-selected={activeTab === "lineups"}
              className={`border-b-2 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight ${activeTab === "lineups" ? "border-highlight text-highlight" : "border-transparent text-secondary hover:text-foreground"}`}
              id={lineupsTabId}
              onClick={() => setActiveTab("lineups")}
              role="tab"
              type="button"
            >
              Lineups
            </button>
          </div>
        </div>

        {activeTab === "overview" ? (
          <div
            aria-labelledby={overviewTabId}
            className="px-5 py-7 sm:px-7 sm:py-9"
            id={overviewPanelId}
            role="tabpanel"
          >
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-secondary">
            {formatKickoff(match.kickoffAt, displayTimeZone)}
          </p>

          <div className="mt-7 rounded-3xl border border-line bg-stadium/55 p-5 sm:p-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 text-center">
              <DetailTeam
                isWinner={winnerTeamId === homeTeam.id}
                team={homeTeam}
              />
              <div className="pt-4">
                <p className="text-3xl font-semibold tabular-nums sm:text-4xl">
                  {match.score
                    ? `${match.score.fullTime.home}–${match.score.fullTime.away}`
                    : "–"}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-secondary">
                  Full time
                </p>
              </div>
              <DetailTeam
                isWinner={winnerTeamId === awayTeam.id}
                team={awayTeam}
              />
            </div>

            {match.score?.decidedBy === "extra_time" ? (
              <ResultNote>Decided after extra time</ResultNote>
            ) : null}
            {match.score?.decidedBy === "penalties" && match.score.penalties ? (
              <ResultNote>
                {homeTeam.name} {match.score.penalties.home}–
                {match.score.penalties.away} {awayTeam.name} on penalties
              </ResultNote>
            ) : null}
          </div>

          <dl className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            <DetailItem label="Stage" value={stageLabel} />
            <DetailItem label="Status" value={formatStatus(match.status)} />
            <DetailItem
              label="Venue"
              value={venue?.name ?? "To be confirmed"}
            />
            <DetailItem
              label="Location"
              value={
                venue ? `${venue.city}, ${venue.countryCode}` : "To be confirmed"
              }
            />
          </dl>
          </div>
        ) : null}

        {activeTab === "events" ? (
          <div
            aria-labelledby={eventsTabId}
            className="px-4 py-5 sm:px-7 sm:py-7"
            id={eventsPanelId}
            role="tabpanel"
          >
            <MatchEventTimeline
              awayTeam={awayTeam}
              events={matchEvents}
              homeTeam={homeTeam}
              players={players}
            />
          </div>
        ) : null}

        {activeTab === "lineups" ? (
          <div
            aria-labelledby={lineupsTabId}
            className="px-4 py-5 sm:px-7 sm:py-7"
            id={lineupsPanelId}
            role="tabpanel"
          >
            <MatchTeamSheetView
              awayTeam={awayTeam}
              awayTeamSheet={awayTeamSheet}
              homeTeam={homeTeam}
              homeTeamSheet={homeTeamSheet}
              players={players}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function DetailTeam({
  isWinner,
  team,
}: Readonly<{ isWinner: boolean; team: TeamType }>) {
  return (
    <div className="flex min-w-0 flex-col items-center">
      <TeamFlag highlighted={isWinner} size="large" team={team} />
      <p
        className={`mt-3 text-sm font-semibold leading-5 sm:text-base ${isWinner ? "text-highlight" : ""}`}
      >
        {team.name}
      </p>
      {isWinner ? (
        <span className="mt-2 rounded-full bg-highlight/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-highlight">
          Winner
        </span>
      ) : null}
    </div>
  );
}

function DetailItem({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-surface px-4 py-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function matchesFilters(
  match: Match,
  stage: StageFilter,
  groupId: string,
) {
  const matchesStage = stage === "all" || match.stage === stage;
  const matchesGroup = groupId === "all" || match.groupId === groupId;

  return matchesStage && matchesGroup;
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
      <TeamFlag highlighted={isWinner} size="small" team={team} />
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

function formatStatus(status: Match["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
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
