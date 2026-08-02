import { cleanup, render, screen, within } from "@testing-library/react";
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
});

function getMatchCard(matchNumber: number) {
  const matchCard = screen.getByText(`Match ${matchNumber}`).closest("article");
  expect(matchCard).not.toBeNull();
  return matchCard as HTMLElement;
}
