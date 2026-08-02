import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the completed tournament overview and match explorer", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "The complete road, match by match.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tournament complete")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Match explorer" }),
    ).toBeInTheDocument();
    expect(screen.getByText("104 matches shown")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Match results" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Match 1")).toBeInTheDocument();
    expect(screen.getByText("Match 104")).toBeInTheDocument();
  });
});
