import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { fifaWorldCup2026Snapshot } from "@/data/fifa-world-cup-2026/snapshot";

import { KnockoutBracketView } from "./knockout-bracket";

afterEach(cleanup);

describe("KnockoutBracketView", () => {
  it("renders the winner-derived bracket and champion route", () => {
    render(
      <KnockoutBracketView
        onSelectMatch={vi.fn()}
        selectedMatchId={undefined}
        snapshot={fifaWorldCup2026Snapshot}
      />,
    );

    const bracket = screen.getByRole("list", {
      name: "Knockout bracket matches",
    });
    const matchButtons = within(bracket).getAllByRole("button", {
      name: /View bracket details for Match/,
    });

    expect(matchButtons).toHaveLength(31);
    expect(matchButtons[0]).toHaveAccessibleName(
      "View bracket details for Match 74: Germany versus Paraguay",
    );
    expect(matchButtons[1]).toHaveAccessibleName(
      "View bracket details for Match 77: France versus Sweden",
    );
    expect(screen.getByLabelText("Follow a team")).toHaveValue("spain");
    expect(screen.getByText("Champion route · 5 knockout matches")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tournament champion" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Tournament champion" })).getByText(
        "Spain",
      ),
    ).toBeInTheDocument();
  });

  it("highlights winners and preserves penalty-shootout scoring", () => {
    render(
      <KnockoutBracketView
        onSelectMatch={vi.fn()}
        selectedMatchId={undefined}
        snapshot={fifaWorldCup2026Snapshot}
      />,
    );

    const penaltyMatch = screen.getByRole("button", {
      name: "View bracket details for Match 74: Germany versus Paraguay",
    });
    const final = screen.getByRole("button", {
      name: "View bracket details for Match 104: Spain versus Argentina",
    });

    expect(within(penaltyMatch).getByText("Penalties 3–4")).toBeInTheDocument();
    expect(within(penaltyMatch).getByText("Paraguay")).toHaveClass(
      "text-highlight",
    );
    expect(within(final).getByText("AET")).toBeInTheDocument();
    expect(within(final).getByText("Spain")).toHaveClass("text-highlight");
    expect(within(final).getByText("W")).toBeInTheDocument();
  });

  it("follows a selected team through the third-place route", async () => {
    const user = userEvent.setup();
    render(
      <KnockoutBracketView
        onSelectMatch={vi.fn()}
        selectedMatchId={undefined}
        snapshot={fifaWorldCup2026Snapshot}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Follow a team"), "england");

    expect(
      screen.getByText("Third-place route · 5 knockout matches"),
    ).toBeInTheDocument();
    const thirdPlaceMatch = screen.getByRole("button", {
      name: "View bracket details for Match 103: France versus England",
    });
    expect(thirdPlaceMatch).toHaveClass("border-highlight/60");
    expect(within(thirdPlaceMatch).getByText("England")).toHaveClass(
      "text-highlight",
    );
  });

  it("opens the existing details flow from a bracket card", async () => {
    const user = userEvent.setup();
    const onSelectMatch = vi.fn();
    render(
      <KnockoutBracketView
        onSelectMatch={onSelectMatch}
        selectedMatchId={undefined}
        snapshot={fifaWorldCup2026Snapshot}
      />,
    );

    const final = screen.getByRole("button", {
      name: "View bracket details for Match 104: Spain versus Argentina",
    });
    await user.click(final);

    expect(onSelectMatch).toHaveBeenCalledWith("match-104", final);
  });

  it("shows a fallback when a complete bracket cannot be derived", () => {
    render(
      <KnockoutBracketView
        onSelectMatch={vi.fn()}
        selectedMatchId={undefined}
        snapshot={{
          ...fifaWorldCup2026Snapshot,
          matches: fifaWorldCup2026Snapshot.matches.filter(
            (match) => match.stage === "group",
          ),
        }}
      />,
    );

    expect(
      screen.getByText("The knockout bracket is not available for this tournament."),
    ).toBeInTheDocument();
  });
});
