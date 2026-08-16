"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type {
  MatchEvent,
  Player,
  Team,
} from "@/domain/tournament/types";

import { TeamFlag } from "./team-flag";

export function MatchEventTimeline({
  awayTeam,
  events,
  homeTeam,
  players,
}: Readonly<{
  awayTeam: Team;
  events: readonly MatchEvent[];
  homeTeam: Team;
  players: readonly Player[];
}>) {
  const orderedEvents = useMemo(
    () => [...events].sort((left, right) => left.sequence - right.sequence),
    [events],
  );
  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );

  if (orderedEvents.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-stadium/40 px-6 py-14 text-center">
        <p className="text-lg font-semibold">Events not available</p>
        <p className="mt-2 text-sm leading-6 text-secondary">
          Goals and cards have not been imported for this match.
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="match-event-timeline-title">
      <div className="grid grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-line bg-stadium/65 px-3 py-4 sm:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] sm:px-5">
        <TeamLaneHeader align="right" team={homeTeam} />
        <div
          aria-hidden="true"
          className="mx-auto grid size-9 place-items-center rounded-full border border-highlight/40 bg-highlight/10 text-[0.6rem] font-black uppercase tracking-wider text-highlight"
        >
          FT
        </div>
        <TeamLaneHeader align="left" team={awayTeam} />
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-highlight">
            Match road
          </p>
          <h3 className="mt-1 text-lg font-semibold" id="match-event-timeline-title">
            Goals and cards
          </h3>
        </div>
        <p className="text-xs text-secondary">
          {orderedEvents.length} {orderedEvents.length === 1 ? "event" : "events"}
        </p>
      </div>

      <ol
        aria-label="Chronological match events"
        className="relative mt-5 space-y-3 before:absolute before:bottom-6 before:left-1/2 before:top-6 before:w-px before:-translate-x-1/2 before:bg-gradient-to-b before:from-highlight before:via-line before:to-highlight/30"
      >
        {orderedEvents.map((event) => {
          const isHomeEvent = event.teamId === homeTeam.id;
          const team = isHomeEvent ? homeTeam : awayTeam;
          const player = playersById.get(event.playerId);

          return (
            <li
              className="relative grid grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)]"
              data-team-side={isHomeEvent ? "home" : "away"}
              key={event.id}
            >
              <div className={isHomeEvent ? "col-start-1" : "col-start-3"}>
                <EventCard
                  align={isHomeEvent ? "right" : "left"}
                  event={event}
                  player={player}
                  team={team}
                />
              </div>
              <EventMinute event={event} />
            </li>
          );
        })}
      </ol>

      <p className="mt-5 text-center text-xs leading-5 text-secondary">
        Penalty-shootout kicks are summarized with the final score.
      </p>
    </section>
  );
}

function TeamLaneHeader({
  align,
  team,
}: Readonly<{ align: "left" | "right"; team: Team }>) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${align === "right" ? "flex-row-reverse text-right" : "text-left"}`}
    >
      <TeamFlag size="small" team={team} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{team.name}</span>
        <span className="mt-0.5 block text-[0.6rem] font-bold uppercase tracking-[0.14em] text-secondary">
          {align === "right" ? "Home" : "Away"}
        </span>
      </span>
    </div>
  );
}

function EventCard({
  align,
  event,
  player,
  team,
}: Readonly<{
  align: "left" | "right";
  event: MatchEvent;
  player: Player | undefined;
  team: Team;
}>) {
  const label = getEventLabel(event);
  const playerName = player?.name ?? "Unknown player";

  return (
    <article
      aria-label={`${formatEventMinute(event)}: ${playerName}, ${label}, ${team.name}`}
      className={`flex min-w-0 items-center gap-2 rounded-2xl border border-line bg-surface px-2.5 py-3 shadow-lg shadow-black/10 sm:gap-3 sm:px-3 ${align === "right" ? "flex-row-reverse text-right" : "text-left"}`}
    >
      <TimelinePlayerAvatar player={player} />
      <span className="min-w-0 flex-1">
        <span className="block break-words text-xs font-semibold leading-4 sm:text-sm">
          {playerName}
        </span>
        <span
          className={`mt-1 flex items-center gap-1.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-secondary sm:text-[0.65rem] ${align === "right" ? "justify-end" : "justify-start"}`}
        >
          <EventSymbol event={event} />
          <span>{label}</span>
        </span>
      </span>
    </article>
  );
}

function EventMinute({ event }: Readonly<{ event: MatchEvent }>) {
  const isExtraTime = event.minute > 90;

  return (
    <div
      aria-label={`${formatEventMinute(event)}${isExtraTime ? ", extra time" : ""}`}
      className="relative z-[1] col-start-2 row-start-1 mx-auto grid min-h-11 w-11 place-items-center rounded-full border border-highlight/45 bg-surface-raised px-1 text-center shadow-lg shadow-black/25 sm:min-h-12 sm:w-12"
    >
      <span className="text-[0.65rem] font-black tabular-nums text-highlight sm:text-xs">
        {formatEventMinute(event)}
      </span>
      {isExtraTime ? (
        <span className="-mt-2 text-[0.45rem] font-bold uppercase tracking-wider text-secondary">
          ET
        </span>
      ) : null}
    </div>
  );
}

function TimelinePlayerAvatar({
  player,
}: Readonly<{ player: Player | undefined }>) {
  const [failedImageUrl, setFailedImageUrl] = useState<string>();
  const imageUrl = player?.imageUrl;
  const showImage = imageUrl !== undefined && imageUrl !== failedImageUrl;

  return (
    <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-foreground/40 bg-surface-raised text-[0.6rem] font-black text-highlight shadow-md shadow-black/20 sm:size-10">
      {showImage ? (
        <Image
          alt=""
          className="object-cover object-top"
          fill
          onError={() => setFailedImageUrl(imageUrl)}
          sizes="40px"
          src={imageUrl}
        />
      ) : (
        <span aria-hidden="true">{getPlayerInitials(player?.name)}</span>
      )}
    </span>
  );
}

function EventSymbol({ event }: Readonly<{ event: MatchEvent }>) {
  if (event.type === "goal") {
    return (
      <span
        aria-hidden="true"
        className="grid size-3.5 shrink-0 place-items-center rounded-full border border-highlight/70 text-[0.45rem] text-highlight"
      >
        ●
      </span>
    );
  }

  const isSecondYellow = event.cardType === "second_yellow";
  const isRed = event.cardType === "red" || isSecondYellow;

  return (
    <span
      aria-hidden="true"
      className="relative inline-block h-4 w-3 shrink-0"
    >
      {isSecondYellow ? (
        <span className="absolute left-0 top-0 h-3.5 w-2.5 -rotate-6 rounded-[2px] bg-amber-300" />
      ) : null}
      <span
        className={`absolute bottom-0 right-0 h-3.5 w-2.5 rotate-6 rounded-[2px] ${isRed ? "bg-red-500" : "bg-amber-300"}`}
      />
    </span>
  );
}

function getEventLabel(event: MatchEvent) {
  if (event.type === "goal") {
    if (event.goalType === "penalty") return "Penalty goal";
    if (event.goalType === "own_goal") return "Own goal";
    return "Goal";
  }

  if (event.cardType === "second_yellow") return "Second yellow · Red card";
  if (event.cardType === "red") return "Red card";
  return "Yellow card";
}

function formatEventMinute(event: MatchEvent) {
  return `${event.minute}${event.stoppageMinute ? `+${event.stoppageMinute}` : ""}′`;
}

function getPlayerInitials(name: string | undefined) {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);
  const firstInitial = parts[0]?.charAt(0) ?? "";
  const lastInitial = parts.at(-1)?.charAt(0) ?? "";

  return `${firstInitial}${parts.length > 1 ? lastInitial : ""}`.toUpperCase();
}
