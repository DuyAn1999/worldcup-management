"use client";

import Image from "next/image";
import { useState } from "react";

import type { Team } from "@/domain/tournament/types";

type TeamFlagSize = "small" | "medium" | "large";

const teamFlagSizeClasses: Record<TeamFlagSize, string> = {
  small: "size-9 rounded-lg",
  medium: "size-11 rounded-xl",
  large: "size-14 rounded-2xl",
};

const teamFlagImageSizes: Record<TeamFlagSize, string> = {
  small: "36px",
  medium: "44px",
  large: "56px",
};

export function TeamFlag({
  highlighted = false,
  size,
  team,
}: Readonly<{
  highlighted?: boolean;
  size: TeamFlagSize;
  team: Team;
}>) {
  const [failedImageUrl, setFailedImageUrl] = useState<string>();
  const showImage =
    team.imageUrl !== undefined && team.imageUrl !== failedImageUrl;

  return (
    <span
      aria-hidden="true"
      className={`relative grid shrink-0 place-items-center overflow-hidden border bg-surface-raised text-[0.62rem] font-black tracking-wide shadow-lg shadow-black/20 ${teamFlagSizeClasses[size]} ${highlighted ? "border-highlight ring-2 ring-highlight/45" : "border-line"}`}
    >
      {showImage ? (
        <Image
          alt=""
          className="object-cover"
          fill
          onError={() => setFailedImageUrl(team.imageUrl)}
          sizes={teamFlagImageSizes[size]}
          src={team.imageUrl}
        />
      ) : (
        <span className="text-highlight">{team.code}</span>
      )}
    </span>
  );
}
