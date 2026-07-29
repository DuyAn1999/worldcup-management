import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the project foundation and tournament stages", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "Every team has a road to the final.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Foundation ready")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Tournament stages" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Round of 32")).toBeInTheDocument();
    expect(screen.getByText("Final")).toBeInTheDocument();
  });
});
