"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type {
  MatchTeamSheet,
  Player,
  Team,
  TeamSheetPlayer,
  TeamSheetPlayerRole,
} from "@/domain/tournament/types";

import { TeamFlag } from "./team-flag";

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
                aria-label={`${team.name} · ${teamSheet.formation}`}
                aria-pressed={isSelected}
                className={`rounded-xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight ${isSelected ? "bg-highlight text-stadium shadow-lg shadow-black/20" : "text-secondary hover:bg-surface hover:text-foreground"}`}
                key={team.id}
                onClick={() => {
                  setSelectedTeamId(team.id);
                  setSelectedPlayerId(undefined);
                }}
                type="button"
              >
                <span className="flex items-center gap-3">
                  <TeamFlag
                    highlighted={isSelected}
                    size="small"
                    team={team}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {team.name}
                    </span>
                    <span
                      className={`mt-1 block text-xs font-bold uppercase tracking-[0.12em] ${isSelected ? "text-stadium/70" : "text-secondary"}`}
                    >
                      {teamSheet.formation}
                    </span>
                  </span>
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
          <TeamFlag size="medium" team={team} />
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
              <PlayerAvatar
                player={selectedPlayer}
                shirtNumber={selectedListedPlayer.shirtNumber}
                size="detail"
              />
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
            <PlayerAvatar
              isSelected={isSelected}
              player={player}
              shirtNumber={listedPlayer.shirtNumber}
              size="pitch"
            />
            <span className="mt-2 max-w-full truncate rounded bg-stadium/85 px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide text-foreground sm:text-[0.65rem]">
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
      <PlayerAvatar
        isSelected={isSelected}
        player={player}
        shirtNumber={listedPlayer.shirtNumber}
        size="list"
      />
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

type PlayerAvatarSize = "pitch" | "list" | "detail";

const playerAvatarSizeClasses: Record<PlayerAvatarSize, string> = {
  pitch: "size-10 sm:size-11",
  list: "size-10",
  detail: "size-12",
};

function PlayerAvatar({
  isSelected = false,
  player,
  shirtNumber,
  size,
}: Readonly<{
  isSelected?: boolean;
  player: Player | undefined;
  shirtNumber: number;
  size: PlayerAvatarSize;
}>) {
  const [failedImageUrl, setFailedImageUrl] = useState<string>();
  const imageUrl = player?.imageUrl;
  const showImage = imageUrl !== undefined && imageUrl !== failedImageUrl;

  return (
    <span
      className={`relative grid shrink-0 place-items-center rounded-full border bg-surface-raised font-black shadow-lg shadow-black/25 transition group-hover:-translate-y-0.5 ${playerAvatarSizeClasses[size]} ${isSelected ? "border-highlight ring-2 ring-highlight/55" : "border-foreground/50"}`}
    >
      <span className="absolute inset-0 overflow-hidden rounded-full">
        {showImage ? (
          <Image
            alt=""
            className="object-cover object-top"
            fill
            onError={() => setFailedImageUrl(imageUrl)}
            sizes={size === "detail" ? "48px" : "44px"}
            src={imageUrl}
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-full place-items-center bg-highlight/15 text-[0.65rem] text-highlight"
          >
            {getPlayerInitials(player?.name)}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border border-stadium bg-highlight text-[0.58rem] font-black text-stadium shadow-md shadow-black/30"
      >
        {shirtNumber}
      </span>
    </span>
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

function getPlayerInitials(name: string | undefined) {
  if (!name) {
    return "?";
  }

  const parts = name.trim().split(/\s+/);
  const firstInitial = parts[0]?.charAt(0) ?? "";
  const lastInitial = parts.at(-1)?.charAt(0) ?? "";

  return `${firstInitial}${parts.length > 1 ? lastInitial : ""}`.toUpperCase();
}

function formatRole(role: TeamSheetPlayerRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
