import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { Team } from "@/domain/tournament/types";

import { TeamFlag } from "./team-flag";

const spain: Team = {
  id: "spain",
  name: "Spain",
  shortName: "Spain",
  code: "ESP",
  countryCode: "ES",
  imageUrl: "https://api.fifa.com/api/v3/picture/flags-sq-4/ESP",
};

afterEach(cleanup);

describe("TeamFlag", () => {
  it("renders the official flag with highlighted treatment", () => {
    const { container } = render(
      <TeamFlag highlighted size="large" team={spain} />,
    );

    const flag = container.querySelector("img");
    expect(flag?.getAttribute("src")).toContain("flags-sq-4%2FESP");
    expect(flag?.parentElement).toHaveClass("ring-highlight/45");
  });

  it("falls back to the team code when the flag fails", () => {
    const { container } = render(<TeamFlag size="small" team={spain} />);
    const flag = container.querySelector("img");
    expect(flag).not.toBeNull();

    fireEvent.error(flag as HTMLImageElement);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("ESP")).toBeInTheDocument();
  });
});
