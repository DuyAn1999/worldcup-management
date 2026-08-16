import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import type { MatchEvent, Player, Team } from "@/domain/tournament/types";

import { MatchEventTimeline } from "./match-event-timeline";

afterEach(cleanup);

const homeTeam = {
  id: "home",
  name: "Home United",
  shortName: "Home",
  code: "HOM",
  imageUrl: "https://example.com/home.png",
} as const satisfies Team;

const awayTeam = {
  id: "away",
  name: "Away City",
  shortName: "Away",
  code: "AWY",
  imageUrl: "https://example.com/away.png",
} as const satisfies Team;

const players = [
  {
    id: "home-player",
    teamId: "home",
    name: "Ada STRIKER",
    imageUrl: "https://example.com/ada.png",
  },
  {
    id: "away-player",
    teamId: "away",
    name: "Bea DEFENDER",
  },
] as const satisfies readonly Player[];

const events = [
  {
    id: "event-2",
    matchId: "match-1",
    sequence: 2,
    minute: 45,
    stoppageMinute: 2,
    teamId: "away",
    playerId: "away-player",
    type: "card",
    cardType: "yellow",
  },
  {
    id: "event-1",
    matchId: "match-1",
    sequence: 1,
    minute: 12,
    teamId: "home",
    playerId: "home-player",
    type: "goal",
    goalType: "open_play",
  },
  {
    id: "event-3",
    matchId: "match-1",
    sequence: 3,
    minute: 90,
    teamId: "home",
    playerId: "home-player",
    type: "goal",
    goalType: "penalty",
  },
  {
    id: "event-4",
    matchId: "match-1",
    sequence: 4,
    minute: 94,
    teamId: "away",
    playerId: "home-player",
    type: "goal",
    goalType: "own_goal",
  },
  {
    id: "event-5",
    matchId: "match-1",
    sequence: 5,
    minute: 105,
    teamId: "away",
    playerId: "away-player",
    type: "card",
    cardType: "red",
  },
  {
    id: "event-6",
    matchId: "match-1",
    sequence: 6,
    minute: 106,
    teamId: "home",
    playerId: "home-player",
    type: "card",
    cardType: "second_yellow",
  },
] as const satisfies readonly MatchEvent[];

describe("MatchEventTimeline", () => {
  it("renders all event semantics in stable sequence and team lanes", () => {
    render(
      <MatchEventTimeline
        awayTeam={awayTeam}
        events={events}
        homeTeam={homeTeam}
        players={players}
      />,
    );

    expect(screen.getByRole("heading", { name: "Goals and cards" })).toBeInTheDocument();
    expect(screen.getByText("6 events")).toBeInTheDocument();

    const timelineItems = screen.getAllByRole("listitem");
    expect(timelineItems).toHaveLength(6);
    expect(timelineItems.map((item) => item.textContent)).toEqual([
      expect.stringContaining("Ada STRIKER"),
      expect.stringContaining("Bea DEFENDER"),
      expect.stringContaining("Penalty goal"),
      expect.stringContaining("Own goal"),
      expect.stringContaining("Red card"),
      expect.stringContaining("Second yellow · Red card"),
    ]);
    expect(timelineItems[0]).toHaveAttribute("data-team-side", "home");
    expect(timelineItems[1]).toHaveAttribute("data-team-side", "away");

    expect(
      screen.getByLabelText("45+2′: Bea DEFENDER, Yellow card, Away City"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("94′, extra time")).toBeInTheDocument();
    expect(screen.getAllByText("ET")).toHaveLength(3);
  });

  it("filters events with counts and preserves keyboard access", async () => {
    const user = userEvent.setup();
    render(
      <MatchEventTimeline
        awayTeam={awayTeam}
        events={events}
        homeTeam={homeTeam}
        players={players}
      />,
    );

    const allFilter = screen.getByRole("button", { name: "All, 6 events" });
    const goalsFilter = screen.getByRole("button", {
      name: "Goals, 3 events",
    });
    const cardsFilter = screen.getByRole("button", {
      name: "Cards, 3 events",
    });
    expect(allFilter).toHaveAttribute("aria-pressed", "true");

    await user.tab();
    expect(allFilter).toHaveFocus();
    await user.tab();
    expect(goalsFilter).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(goalsFilter).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("3 of 6 events")).toBeInTheDocument();
    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual([
      expect.stringContaining("Ada STRIKER"),
      expect.stringContaining("Penalty goal"),
      expect.stringContaining("Own goal"),
    ]);

    await user.click(cardsFilter);
    expect(cardsFilter).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByText("Penalty goal")).not.toBeInTheDocument();

    const firstEventCard = screen.getByLabelText(
      "45+2′: Bea DEFENDER, Yellow card, Away City",
    );
    expect(firstEventCard).toHaveAttribute("tabindex", "0");
    firstEventCard.focus();
    expect(firstEventCard).toHaveFocus();
  });

  it("shows a filter-specific empty state without implying missing data", async () => {
    const user = userEvent.setup();
    render(
      <MatchEventTimeline
        awayTeam={awayTeam}
        events={[events[1]]}
        homeTeam={homeTeam}
        players={players}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cards, 0 events" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "No cards in this match",
    );
    expect(
      screen.getByText("Try another filter to explore the imported event record."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Events not available")).not.toBeInTheDocument();
  });

  it("uses official portraits and falls back to player initials", () => {
    render(
      <MatchEventTimeline
        awayTeam={awayTeam}
        events={[events[1]]}
        homeTeam={homeTeam}
        players={players}
      />,
    );

    const eventCard = screen.getByLabelText(
      "12′: Ada STRIKER, Goal, Home United",
    );
    const portrait = within(eventCard).getByRole("presentation");
    expect(portrait.getAttribute("src")).toContain("ada.png");

    fireEvent.error(portrait);

    expect(within(eventCard).queryByRole("presentation")).not.toBeInTheDocument();
    expect(within(eventCard).getByText("AS")).toBeInTheDocument();
  });

  it("distinguishes missing event data from a match with no incidents", () => {
    render(
      <MatchEventTimeline
        awayTeam={awayTeam}
        events={[]}
        homeTeam={homeTeam}
        players={players}
      />,
    );

    expect(screen.getByText("Events not available")).toBeInTheDocument();
    expect(
      screen.getByText("Goals and cards have not been imported for this match."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Chronological match events" }),
    ).not.toBeInTheDocument();
  });
});
