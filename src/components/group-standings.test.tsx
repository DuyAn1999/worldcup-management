import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { fifaWorldCup2026Snapshot } from "@/data/fifa-world-cup-2026/snapshot";

import { GroupStandingsView } from "./group-standings";

afterEach(cleanup);

describe("GroupStandingsView", () => {
  it("renders the selected group table with qualification and statistics", () => {
    render(<GroupStandingsView snapshot={fifaWorldCup2026Snapshot} />);

    const groupTable = screen.getByRole("table", {
      name: "Group A standings",
    });
    const mexicoRow = within(groupTable).getByRole("row", { name: /Mexico/ });
    const southAfricaRow = within(groupTable).getByRole("row", {
      name: /South Africa/,
    });
    const koreaRow = within(groupTable).getByRole("row", { name: /Korea Republic/ });

    expect(within(mexicoRow).getByText("Qualified")).toBeInTheDocument();
    expect(within(mexicoRow).getAllByRole("cell").at(-1)).toHaveTextContent("9");
    expect(within(southAfricaRow).getByText("Qualified")).toBeInTheDocument();
    expect(within(koreaRow).getByText("Eliminated")).toBeInTheDocument();
    expect(within(groupTable).getAllByRole("row")).toHaveLength(5);
    expect(mexicoRow.querySelector("img")?.getAttribute("src")).toContain(
      "flags-sq-4%2FMEX",
    );
  });

  it("switches between all twelve group routes", async () => {
    const user = userEvent.setup();
    render(<GroupStandingsView snapshot={fifaWorldCup2026Snapshot} />);

    expect(
      screen.getByRole("navigation", { name: "Group standings selector" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Show Group .* standings/ }),
    ).toHaveLength(12);

    const groupLButton = screen.getByRole("button", {
      name: "Show Group L standings",
    });
    await user.click(groupLButton);

    expect(groupLButton).toHaveAttribute("aria-pressed", "true");
    const groupLTable = screen.getByRole("table", {
      name: "Group L standings",
    });
    expect(within(groupLTable).getByText("England")).toBeInTheDocument();
    expect(within(groupLTable).getByText("Panama")).toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: "Group A standings" }),
    ).not.toBeInTheDocument();
  });

  it("shows the twelve-team third-place ranking and eight qualifiers", () => {
    render(<GroupStandingsView snapshot={fifaWorldCup2026Snapshot} />);

    const thirdPlaceTable = screen.getByRole("table", {
      name: "Best third-place ranking",
    });
    const rows = within(thirdPlaceTable).getAllByRole("row");

    expect(rows).toHaveLength(13);
    expect(
      rows
        .slice(1)
        .filter((row) => row.textContent?.includes("Best third")),
    ).toHaveLength(8);
    expect(screen.getByText("The cutoff falls after position eight.")).toBeInTheDocument();
  });

  it("distinguishes partial and provisional standings", () => {
    const groupA = fifaWorldCup2026Snapshot.groups[0];
    const openingMatch = fifaWorldCup2026Snapshot.matches.find(
      (match) => match.matchNumber === 1,
    );

    if (!groupA || !openingMatch) throw new Error("Expected Group A fixture data");

    render(
      <GroupStandingsView
        snapshot={{
          ...fifaWorldCup2026Snapshot,
          groups: [groupA],
          matches: [openingMatch],
        }}
      />,
    );

    expect(screen.getByText("Tables in progress")).toBeInTheDocument();
    expect(screen.getAllByText(/Pending · Provisional/).length).toBeGreaterThan(0);
    expect(screen.getByText("Provisional order:")).toBeInTheDocument();
  });
});
