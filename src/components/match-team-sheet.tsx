"use client";

import { useMemo, useState } from "react";

import type {
  MatchTeamSheet,
  Player,
  Team,
  TeamSheetPlayer,
  TeamSheetPlayerRole,
} from "@/domain/tournament/types";

type TeamSheetOption = Readonly<{
  team: Team;
  teamSheet: MatchTeamSheet;
}>;

export function MatchTeamSheetView({
  awayTeam,
  awayTeamSheet,
  homeTeam,
  homeTeamSheet,
  players,
}: Readonly<{
  awayTeam: Team;
  awayTeamSheet: MatchTeamSheet | undefined;
  homeTeam: Team;
  homeTeamSheet: MatchTeamSheet | undefined;
  players: readonly Player[];
}>) {
  const teamSheetOptions = useMemo(
    () =>
      [
        homeTeamSheet ? { team: homeTeam, teamSheet: homeTeamSheet } : undefined,
        awayTeamSheet ? { team: awayTeam, teamSheet: awayTeamSheet } : undefined,
      ].filter((option): option is TeamSheetOption => option !== undefined),
    [awayTeam, awayTeamSheet, homeTeam, homeTeamSheet],
  );
  const [selectedTeamId, setSelectedTeamId] = useState(
    teamSheetOptions[0]?.team.id,
  );
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>();
  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );

  if (teamSheetOptions.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-stadium/40 px-6 py-14 text-center">
        <p className="text-lg font-semibold">Lineup not available</p>
        <p className="mt-2 text-sm leading-6 text-secondary">
          The official team sheets have not been imported for this match.
        </p>
      </div>
    );
  }

  const selectedOption =
    teamSheetOptions.find((option) => option.team.id === selectedTeamId) ??
    teamSheetOptions[0];

  return (
    <div>
      {teamSheetOptions.length > 1 ? (
        <div
          aria-label="Team lineup"
          className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-stadium/70 p-1.5"
          role="group"
        >
          {teamSheetOptions.map(({ team, teamSheet }) => {
            const isSelected = team.id === selectedOption.team.id;

            return (
              <button
                aria-pressed={isSelected}
                className={`rounded-xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight ${isSelected ? "bg-highlight text-stadium shadow-lg shadow-black/20" : "text-secondary hover:bg-surface hover:text-foreground"}`}
                key={team.id}
                onClick={() => {
                  setSelectedTeamId(team.id);
                  setSelectedPlayerId(undefined);
                }}
                type="button"
              >
                <span className="block text-xs font-bold uppercase tracking-[0.14em]">
                  {team.code}
                </span>
                <span className="mt-1 block text-sm font-semibold">
                  {team.name} · {teamSheet.formation}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <TeamSheetCard
        key={selectedOption.team.id}
        onSelectPlayer={setSelectedPlayerId}
        playersById={playersById}
        selectedPlayerId={selectedPlayerId}
        team={selectedOption.team}
        teamSheet={selectedOption.teamSheet}
      />
    </div>
  );
}

function TeamSheetCard({
  onSelectPlayer,
  playersById,
  selectedPlayerId,
  team,
  teamSheet,
}: Readonly<{
  onSelectPlayer: (playerId: string) => void;
  playersById: ReadonlyMap<string, Player>;
  selectedPlayerId: string | undefined;
  team: Team;
  teamSheet: MatchTeamSheet;
}>) {
  const selectedListedPlayer = [
    ...teamSheet.starters,
    ...teamSheet.substitutes,
  ].find((listedPlayer) => listedPlayer.playerId === selectedPlayerId);
  const selectedPlayer = selectedListedPlayer
    ? playersById.get(selectedListedPlayer.playerId)
    : undefined;
  const selectedPlayerIsStarter = teamSheet.starters.some(
    (listedPlayer) => listedPlayer.playerId === selectedPlayerId,
  );

  return (
    <article className="mt-5 overflow-hidden rounded-3xl border border-line bg-stadium/45">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full border border-highlight/45 bg-highlight/10 text-xs font-black text-highlight">
            {team.code}
          </span>
          <div>
            <h3 className="font-semibold">{team.name}</h3>
            <p className="mt-1 text-sm text-secondary">
              Coach {teamSheet.headCoach.name}
            </p>
          </div>
        </div>
        <div className="rounded-full border border-highlight/35 bg-highlight/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-highlight">
          {teamSheet.formation}
        </div>
      </header>

      <div className="p-4 sm:p-5">
        <FormationPitch
          onSelectPlayer={onSelectPlayer}
          playersById={playersById}
          selectedPlayerId={selectedPlayerId}
          teamSheet={teamSheet}
        />

        <div
          aria-live="polite"
          className="mt-4 min-h-20 rounded-2xl border border-line bg-surface px-4 py-3"
        >
          {selectedPlayer && selectedListedPlayer ? (
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-highlight font-bold text-stadium">
                {selectedListedPlayer.shirtNumber}
              </span>
              <div>
                <p className="font-semibold">{selectedPlayer.name}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-secondary">
                  {selectedPlayerIsStarter ? "Starting XI" : "Substitute"} ·{" "}
                  {formatRole(selectedListedPlayer.role)}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold">Explore the team sheet</p>
              <p className="mt-1 text-xs leading-5 text-secondary">
                Select a player marker or bench entry for details.
              </p>
            </div>
          )}
        </div>

        <details className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-highlight">
            <span>Substitutes</span>
            <span className="rounded-full bg-highlight/10 px-2.5 py-1 text-xs text-highlight">
              {teamSheet.substitutes.length}
            </span>
          </summary>
          <ul className="grid gap-px border-t border-line bg-line sm:grid-cols-2">
            {teamSheet.substitutes.map((listedPlayer) => (
              <li className="bg-surface" key={listedPlayer.playerId}>
                <PlayerListButton
                  isSelected={listedPlayer.playerId === selectedPlayerId}
                  listedPlayer={listedPlayer}
                  onSelectPlayer={onSelectPlayer}
                  player={playersById.get(listedPlayer.playerId)}
                />
              </li>
            ))}
          </ul>
        </details>
      </div>
    </article>
  );
}

function FormationPitch({
  onSelectPlayer,
  playersById,
  selectedPlayerId,
  teamSheet,
}: Readonly<{
  onSelectPlayer: (playerId: string) => void;
  playersById: ReadonlyMap<string, Player>;
  selectedPlayerId: string | undefined;
  teamSheet: MatchTeamSheet;
}>) {
  const goalkeeper = teamSheet.starters.find(
    (player) => player.role === "goalkeeper",
  );
  const formationRows = buildFormationRows(teamSheet);

  return (
    <div className="formation-pitch mx-auto aspect-[3/4] w-full max-w-md rounded-[1.75rem] border border-highlight/35 p-4 shadow-inner shadow-black/30 sm:p-5">
      <div aria-hidden="true" className="formation-penalty-area formation-penalty-area-top" />
      <div aria-hidden="true" className="formation-penalty-area formation-penalty-area-bottom" />
      <div className="relative z-10 flex h-full flex-col-reverse justify-between py-3">
        {goalkeeper ? (
          <FormationRow
            listedPlayers={[goalkeeper]}
            onSelectPlayer={onSelectPlayer}
            playersById={playersById}
            selectedPlayerId={selectedPlayerId}
          />
        ) : null}
        {formationRows.map((row, index) => (
          <FormationRow
            key={`${teamSheet.formation}-${index}`}
            listedPlayers={row}
            onSelectPlayer={onSelectPlayer}
            playersById={playersById}
            selectedPlayerId={selectedPlayerId}
          />
        ))}
      </div>
    </div>
  );
}

function FormationRow({
  listedPlayers,
  onSelectPlayer,
  playersById,
  selectedPlayerId,
}: Readonly<{
  listedPlayers: readonly TeamSheetPlayer[];
  onSelectPlayer: (playerId: string) => void;
  playersById: ReadonlyMap<string, Player>;
  selectedPlayerId: string | undefined;
}>) {
  return (
    <div className="flex items-start justify-around gap-1">
      {listedPlayers.map((listedPlayer) => {
        const player = playersById.get(listedPlayer.playerId);
        const isSelected = listedPlayer.playerId === selectedPlayerId;

        return (
          <button
            aria-label={`${player?.name ?? "Unknown player"}, number ${listedPlayer.shirtNumber}, ${formatRole(listedPlayer.role)}`}
            className="group flex min-w-0 max-w-20 flex-1 flex-col items-center text-center focus-visible:outline-none"
            key={listedPlayer.playerId}
            onClick={() => onSelectPlayer(listedPlayer.playerId)}
            type="button"
          >
            <span
              className={`grid size-9 place-items-center rounded-full border text-xs font-black shadow-lg shadow-black/25 transition group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-highlight group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-stadium sm:size-10 ${isSelected ? "border-highlight bg-highlight text-stadium" : "border-foreground/50 bg-surface-raised text-foreground"}`}
            >
              {listedPlayer.shirtNumber}
            </span>
            <span className="mt-1.5 max-w-full truncate rounded bg-stadium/85 px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide text-foreground sm:text-[0.65rem]">
              {getShortName(player?.name)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PlayerListButton({
  isSelected,
  listedPlayer,
  onSelectPlayer,
  player,
}: Readonly<{
  isSelected: boolean;
  listedPlayer: TeamSheetPlayer;
  onSelectPlayer: (playerId: string) => void;
  player: Player | undefined;
}>) {
  return (
    <button
      aria-pressed={isSelected}
      className={`flex w-full items-center gap-3 px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-highlight ${isSelected ? "bg-highlight/10" : "hover:bg-stadium/60"}`}
      onClick={() => onSelectPlayer(listedPlayer.playerId)}
      type="button"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-stadium text-xs font-bold text-highlight">
        {listedPlayer.shirtNumber}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {player?.name ?? "Unknown player"}
        </span>
        <span className="mt-0.5 block text-[0.65rem] uppercase tracking-[0.12em] text-secondary">
          {formatRole(listedPlayer.role)}
        </span>
      </span>
    </button>
  );
}

function buildFormationRows(teamSheet: MatchTeamSheet) {
  const rowSizes = teamSheet.formation.split("-").map(Number);
  const outfieldPlayers = teamSheet.starters.filter(
    (player) => player.role !== "goalkeeper",
  );
  let offset = 0;

  return rowSizes.map((rowSize) => {
    const row = outfieldPlayers.slice(offset, offset + rowSize);
    offset += rowSize;
    return row;
  });
}

function getShortName(name: string | undefined) {
  return name?.trim().split(/\s+/).at(-1) ?? "TBC";
}

function formatRole(role: TeamSheetPlayerRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
