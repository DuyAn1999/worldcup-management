import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { fifaWorldCup2026Snapshot } from "@/data/fifa-world-cup-2026/snapshot";

import { MatchExplorer } from "./match-explorer";

afterEach(cleanup);

describe("MatchExplorer", () => {
  it("highlights a regular-time winner but leaves a draw neutral", () => {
    render(<MatchExplorer snapshot={fifaWorldCup2026Snapshot} />);

    const openingMatch = getMatchCard(1);
    expect(within(openingMatch).getByText("Mexico")).toHaveClass(
      "text-highlight",
    );
    expect(within(openingMatch).getByText("Winner")).toBeInTheDocument();
    expect(
      [...openingMatch.querySelectorAll("img")].map((image) =>
        image.getAttribute("src"),
      ),
    ).toEqual([
      expect.stringContaining("flags-sq-4%2FMEX"),
      expect.stringContaining("flags-sq-4%2FRSA"),
    ]);

    const drawnMatch = getMatchCard(3);
    expect(within(drawnMatch).queryByText("Winner")).not.toBeInTheDocument();
    expect(within(drawnMatch).getByText("Canada")).not.toHaveClass(
      "text-highlight",
    );
    expect(
      within(drawnMatch).getByText("Bosnia and Herzegovina"),
    ).not.toHaveClass("text-highlight");
  });

  it("filters the road by tournament stage", async () => {
    const user = userEvent.setup();
    render(<MatchExplorer snapshot={fifaWorldCup2026Snapshot} />);

    await user.click(screen.getByRole("button", { name: "Final" }));

    expect(screen.getByText("1 match shown")).toBeInTheDocument();
    expect(screen.getByText("Match 104")).toBeInTheDocument();
    expect(screen.getByText("Spain")).toBeInTheDocument();
    expect(screen.getByText("Argentina")).toBeInTheDocument();
    expect(screen.getByText("After extra time")).toBeInTheDocument();
    expect(screen.queryByText("Match 1")).not.toBeInTheDocument();
  });

  it("selecting a group shows its six group-stage matches", async () => {
    const user = userEvent.setup();
    render(<MatchExplorer snapshot={fifaWorldCup2026Snapshot} />);

    await user.selectOptions(screen.getByLabelText("Group filter"), "group-a");

    expect(screen.getByText("6 matches shown")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Group stage" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Match 1")).toBeInTheDocument();
    expect(screen.getByText("Match 54")).toBeInTheDocument();
    expect(screen.queryByText("Match 3")).not.toBeInTheDocument();
  });

  it("shows penalty shootout context separately from the match score", async () => {
    const user = userEvent.setup();
    render(<MatchExplorer snapshot={fifaWorldCup2026Snapshot} />);

    await user.click(screen.getByRole("button", { name: "Round of 32" }));

    expect(screen.getByText("16 matches shown")).toBeInTheDocument();
    expect(
      screen.getByText("Paraguay win 4–3 on penalties"),
    ).toBeInTheDocument();
    const shootoutMatch = getMatchCard(74);
    expect(within(shootoutMatch).getByText("Paraguay")).toHaveClass(
      "text-highlight",
    );
    expect(within(shootoutMatch).getByText("Winner")).toBeInTheDocument();
  });

  it("opens match details and restores focus when closed", async () => {
    const user = userEvent.setup();
    render(<MatchExplorer snapshot={fifaWorldCup2026Snapshot} />);

    const openingMatchButton = screen.getByRole("button", {
      name: "View details for Match 1: Mexico versus South Africa",
    });
    await user.click(openingMatchButton);

    const dialog = screen.getByRole("dialog", {
      name: "Match 1 details",
    });
    expect(openingMatchButton).toHaveAttribute("aria-expanded", "true");
    expect(within(dialog).getByText("Mexico City Stadium")).toBeInTheDocument();
    expect(within(dialog).getByText("Mexico City, MX")).toBeInTheDocument();
    expect(dialog.querySelectorAll('img[src*="flags-sq-4"]').length).toBe(2);

    const closeButton = within(dialog).getByRole("button", {
      name: "Close match details",
    });
    expect(closeButton).toHaveFocus();
    await user.click(closeButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(openingMatchButton).toHaveFocus();
    expect(openingMatchButton).toHaveAttribute("aria-expanded", "false");
  });

  it("shows decision context in extra-time and penalty match details", async () => {
    const user = userEvent.setup();
    render(<MatchExplorer snapshot={fifaWorldCup2026Snapshot} />);

    await user.click(screen.getByRole("button", { name: "Final" }));
    await user.click(
      screen.getByRole("button", {
        name: "View details for Match 104: Spain versus Argentina",
      }),
    );

    expect(
      within(screen.getByRole("dialog")).getByText(
        "Decided after extra time",
      ),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Round of 32" }));
    await user.click(
      screen.getByRole("button", {
        name: "View details for Match 74: Germany versus Paraguay",
      }),
    );

    expect(
      within(screen.getByRole("dialog")).getByText(
        "Germany 3–4 Paraguay on penalties",
      ),
    ).toBeInTheDocument();
  });

  it("explores the final formations, players, and substitutes", async () => {
    const user = userEvent.setup();
    render(<MatchExplorer snapshot={fifaWorldCup2026Snapshot} />);

    await user.click(screen.getByRole("button", { name: "Final" }));
    await user.click(
      screen.getByRole("button", {
        name: "View details for Match 104: Spain versus Argentina",
      }),
    );

    const dialog = screen.getByRole("dialog", { name: "Match 104 details" });
    expect(within(dialog).getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.click(within(dialog).getByRole("tab", { name: "Lineups" }));

    expect(
      within(dialog).getByText(/Luis de la Fuente Castillo/),
    ).toBeInTheDocument();
    const unaiMarker = within(dialog).getByRole("button", {
      name: "Unai SIMON, number 23, Goalkeeper",
    });
    const unaiPortrait = unaiMarker.querySelector("img");
    expect(unaiPortrait?.getAttribute("src")).toContain(
      "SIMON-Unai_430753",
    );

    await user.click(unaiMarker);
    expect(within(dialog).getByText("Starting XI · Goalkeeper")).toBeInTheDocument();

    await user.click(within(dialog).getByText("Substitutes"));
    await user.click(
      within(dialog).getByRole("button", { name: /Ferran TORRES/ }),
    );
    expect(within(dialog).getByText("Substitute · Forward")).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: /Argentina · 4-4-2/ }),
    );
    expect(within(dialog).getByText(/Lionel SCALONI/)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", {
        name: "Lionel MESSI, number 10, Forward",
      }),
    ).toBeInTheDocument();
  });

  it("falls back to player initials when an official portrait fails", async () => {
    const user = userEvent.setup();
    render(<MatchExplorer snapshot={fifaWorldCup2026Snapshot} />);

    await user.click(screen.getByRole("button", { name: "Final" }));
    await user.click(
      screen.getByRole("button", {
        name: "View details for Match 104: Spain versus Argentina",
      }),
    );
    const dialog = screen.getByRole("dialog", { name: "Match 104 details" });
    await user.click(within(dialog).getByRole("tab", { name: "Lineups" }));

    const unaiMarker = within(dialog).getByRole("button", {
      name: "Unai SIMON, number 23, Goalkeeper",
    });
    const unaiPortrait = unaiMarker.querySelector("img");
    expect(unaiPortrait).not.toBeNull();

    fireEvent.error(unaiPortrait as HTMLImageElement);

    expect(unaiMarker.querySelector("img")).toBeNull();
    expect(within(unaiMarker).getByText("US")).toBeInTheDocument();
    expect(within(unaiMarker).getByText("23")).toBeInTheDocument();
  });

  it("shows a lineup fallback for matches without imported team sheets", async () => {
    const user = userEvent.setup();
    render(<MatchExplorer snapshot={fifaWorldCup2026Snapshot} />);

    await user.click(
      screen.getByRole("button", {
        name: "View details for Match 1: Mexico versus South Africa",
      }),
    );
    const dialog = screen.getByRole("dialog", { name: "Match 1 details" });
    await user.click(within(dialog).getByRole("tab", { name: "Lineups" }));

    expect(within(dialog).getByText("Lineup not available")).toBeInTheDocument();
  });

  it("dismisses details from the backdrop and when filtering removes the match", async () => {
    const user = userEvent.setup();
    render(<MatchExplorer snapshot={fifaWorldCup2026Snapshot} />);

    const openingMatchButton = screen.getByRole("button", {
      name: "View details for Match 1: Mexico versus South Africa",
    });
    await user.click(openingMatchButton);
    await user.click(screen.getByTestId("match-details-backdrop"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(openingMatchButton);
    await user.click(screen.getByRole("button", { name: "Final" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("1 match shown")).toBeInTheDocument();
  });
});

function getMatchCard(matchNumber: number) {
  const matchCard = screen.getByText(`Match ${matchNumber}`).closest("article");
  expect(matchCard).not.toBeNull();
  return matchCard as HTMLElement;
}
