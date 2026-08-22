"use client";

import { useMemo, useState } from "react";

import {
  calculateTournamentStandings,
  type QualificationStatus,
  type StandingsRankStatus,
} from "@/domain/tournament/standings";
import type { Team, TournamentSnapshot } from "@/domain/tournament/types";

import { TeamFlag } from "./team-flag";

type GroupStandingsViewProps = Readonly<{
  snapshot: TournamentSnapshot;
}>;

const qualificationStyles: Record<QualificationStatus, string> = {
  qualified: "border-highlight/40 bg-highlight/10 text-highlight",
  best_third_qualified: "border-highlight/40 bg-highlight/10 text-highlight",
  eliminated: "border-line bg-stadium/55 text-secondary",
  pending: "border-line bg-surface text-secondary",
};

export function GroupStandingsView({ snapshot }: GroupStandingsViewProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(
    snapshot.groups[0]?.id ?? "",
  );
  const standings = useMemo(
    () => calculateTournamentStandings(snapshot),
    [snapshot],
  );
  const teamsById = useMemo(
    () => new Map(snapshot.teams.map((team) => [team.id, team])),
    [snapshot.teams],
  );
  const selectedGroupDefinition =
    snapshot.groups.find((group) => group.id === selectedGroupId) ??
    snapshot.groups[0];
  const selectedGroup = standings.groups.find(
    (group) => group.groupId === selectedGroupDefinition?.id,
  );

  if (!selectedGroup || !selectedGroupDefinition) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-line px-6 py-14 text-center text-secondary">
        Group standings are not available for this tournament.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-highlight">
            Group-stage map
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Twelve routes into the knockouts
          </h3>
          <p className="mt-3 text-sm leading-6 text-secondary sm:text-base">
            The top two teams in every group qualify directly. The eight
            strongest third-place teams complete the Round of 32.
          </p>
        </div>
        <div className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
          {standings.isComplete ? "Final tables" : "Tables in progress"}
        </div>
      </div>

      <nav
        aria-label="Group standings selector"
        className="group-route mt-7 grid grid-cols-6 gap-x-2 gap-y-4 lg:grid-cols-12"
      >
        {snapshot.groups.map((group) => {
          const isSelected = group.id === selectedGroup.groupId;
          const groupLetter = group.name.replace(/^Group\s+/u, "");

          return (
            <button
              aria-label={`Show ${group.name} standings`}
              aria-pressed={isSelected}
              className="group relative z-10 flex flex-col items-center gap-2 text-xs font-semibold"
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              type="button"
            >
              <span
                className={`journey-marker ${isSelected ? "journey-marker-active" : ""}`}
              >
                {groupLetter}
              </span>
              <span
                className={
                  isSelected
                    ? "text-foreground"
                    : "text-secondary transition group-hover:text-foreground"
                }
              >
                {group.name}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start">
        <section
          aria-labelledby="selected-group-title"
          className="overflow-hidden rounded-3xl border border-line bg-surface/85 shadow-2xl shadow-black/15"
        >
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                Selected route
              </p>
              <h4
                className="mt-1 text-xl font-semibold tracking-tight"
                id="selected-group-title"
              >
                {selectedGroupDefinition.name}
              </h4>
            </div>
            <StatusKey />
          </header>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[43rem] border-collapse text-sm">
              <caption className="sr-only">
                {selectedGroupDefinition.name} standings
              </caption>
              <thead className="bg-stadium/55 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-secondary">
                <tr>
                  <th className="w-16 px-5 py-3 text-left" scope="col">
                    Pos
                  </th>
                  <th className="px-3 py-3 text-left" scope="col">
                    Team
                  </th>
                  <StatHeader label="Played" shortLabel="P" />
                  <StatHeader label="Won" shortLabel="W" />
                  <StatHeader label="Drawn" shortLabel="D" />
                  <StatHeader label="Lost" shortLabel="L" />
                  <StatHeader label="Goal difference" shortLabel="GD" />
                  <th className="w-16 px-5 py-3 text-right" scope="col">
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedGroup.rows.map((row) => {
                  const team = teamsById.get(row.teamId);

                  return (
                    <tr
                      className="border-t border-line/75 transition hover:bg-highlight/[0.035]"
                      key={row.teamId}
                    >
                      <td className="px-5 py-4">
                        <span
                          className={`grid size-8 place-items-center rounded-full border text-xs font-bold ${row.qualificationStatus === "qualified" || row.qualificationStatus === "best_third_qualified" ? "border-highlight/45 bg-highlight/10 text-highlight" : "border-line bg-stadium text-secondary"}`}
                        >
                          {row.position}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {team ? (
                          <StandingTeam
                            qualificationStatus={row.qualificationStatus}
                            rankStatus={row.rankStatus}
                            team={team}
                          />
                        ) : (
                          <span className="text-secondary">Unknown team</span>
                        )}
                      </td>
                      <StatCell value={row.played} />
                      <StatCell value={row.wins} />
                      <StatCell value={row.draws} />
                      <StatCell value={row.losses} />
                      <StatCell value={formatGoalDifference(row.goalDifference)} />
                      <td className="px-5 py-4 text-right text-base font-bold text-foreground">
                        {row.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section
          aria-labelledby="third-place-title"
          className="overflow-hidden rounded-3xl border border-line bg-surface/85 shadow-2xl shadow-black/15"
        >
          <header className="border-b border-line px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-highlight">
              Wildcard lane
            </p>
            <h4
              className="mt-1 text-xl font-semibold tracking-tight"
              id="third-place-title"
            >
              Best third-place teams
            </h4>
            <p className="mt-2 text-sm leading-5 text-secondary">
              The cutoff falls after position eight.
            </p>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[21rem] border-collapse text-sm">
              <caption className="sr-only">Best third-place ranking</caption>
              <thead className="bg-stadium/55 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-secondary">
                <tr>
                  <th className="px-5 py-3 text-left" scope="col">
                    Rank
                  </th>
                  <th className="px-2 py-3 text-left" scope="col">
                    Team
                  </th>
                  <th className="px-2 py-3 text-right" scope="col">
                    GD
                  </th>
                  <th className="px-5 py-3 text-right" scope="col">
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.thirdPlaceRanking.map((row, index) => {
                  const team = teamsById.get(row.teamId);
                  const group = snapshot.groups.find(
                    (candidate) => candidate.id === row.groupId,
                  );

                  return (
                    <tr
                      className={`border-t border-line/75 ${index === 8 ? "border-t-2 border-t-highlight/40" : ""}`}
                      key={row.groupId}
                    >
                      <td className="px-5 py-3">
                        <span
                          className={`grid size-7 place-items-center rounded-full text-xs font-bold ${row.qualificationStatus === "best_third_qualified" ? "bg-highlight text-stadium" : "bg-stadium text-secondary"}`}
                        >
                          {row.position}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          {team ? (
                            <TeamFlag size="small" team={team} />
                          ) : null}
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {team?.shortName ?? "Unknown"}
                            </p>
                            <p className="mt-0.5 text-xs text-secondary">
                              {group?.name ?? row.groupId} ·{" "}
                              {getQualificationLabel(row.qualificationStatus)}
                              {row.rankStatus === "provisional"
                                ? " · Provisional"
                                : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-right font-medium text-secondary">
                        {formatGoalDifference(row.goalDifference)}
                      </td>
                      <td className="px-5 py-3 text-right font-bold">
                        {row.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {hasProvisionalRows(standings) ? (
        <p className="mt-4 rounded-2xl border border-line bg-surface/70 px-4 py-3 text-sm leading-6 text-secondary">
          <span className="font-semibold text-foreground">Provisional order:</span>{" "}
          tied teams still require fair-play or FIFA-ranking data that is not
          present in this snapshot.
        </p>
      ) : null}
    </div>
  );
}

function StandingTeam({
  qualificationStatus,
  rankStatus,
  team,
}: Readonly<{
  qualificationStatus: QualificationStatus;
  rankStatus: StandingsRankStatus;
  team: Team;
}>) {
  return (
    <div className="flex min-w-56 items-center gap-3">
      <TeamFlag size="small" team={team} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{team.name}</p>
        <span
          className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.09em] ${qualificationStyles[qualificationStatus]}`}
        >
          {getQualificationLabel(qualificationStatus)}
          {rankStatus === "provisional" ? " · Provisional" : ""}
        </span>
      </div>
    </div>
  );
}

function StatusKey() {
  return (
    <div className="flex flex-wrap gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.1em]">
      <span className="rounded-full border border-highlight/40 bg-highlight/10 px-2 py-1 text-highlight">
        Advances
      </span>
      <span className="rounded-full border border-line bg-stadium/55 px-2 py-1 text-secondary">
        Eliminated
      </span>
    </div>
  );
}

function StatHeader({
  label,
  shortLabel,
}: Readonly<{ label: string; shortLabel: string }>) {
  return (
    <th className="w-14 px-2 py-3 text-right" scope="col" title={label}>
      {shortLabel}
    </th>
  );
}

function StatCell({ value }: Readonly<{ value: number | string }>) {
  return <td className="px-2 py-4 text-right text-secondary">{value}</td>;
}

function getQualificationLabel(status: QualificationStatus) {
  switch (status) {
    case "qualified":
      return "Qualified";
    case "best_third_qualified":
      return "Best third";
    case "eliminated":
      return "Eliminated";
    case "pending":
      return "Pending";
  }
}

function formatGoalDifference(goalDifference: number) {
  return goalDifference > 0 ? `+${goalDifference}` : String(goalDifference);
}

function hasProvisionalRows(
  standings: ReturnType<typeof calculateTournamentStandings>,
) {
  return (
    standings.groups.some((group) =>
      group.rows.some((row) => row.rankStatus === "provisional"),
    ) ||
    standings.thirdPlaceRanking.some(
      (row) => row.rankStatus === "provisional",
    )
  );
}
