import { MatchExplorer } from "@/components/match-explorer";
import { fifaWorldCup2026Snapshot } from "@/data/fifa-world-cup-2026/snapshot";

const finalMatch = fifaWorldCup2026Snapshot.matches.find(
  (match) => match.stage === "final",
);
const homeWonFinal = finalMatch?.score
  ? finalMatch.score.decidedBy === "penalties" && finalMatch.score.penalties
    ? finalMatch.score.penalties.home > finalMatch.score.penalties.away
    : finalMatch.score.fullTime.home > finalMatch.score.fullTime.away
  : undefined;
const championTeamId =
  finalMatch?.home.type === "team" &&
  finalMatch.away.type === "team" &&
  homeWonFinal !== undefined
    ? homeWonFinal
      ? finalMatch.home.teamId
      : finalMatch.away.teamId
    : undefined;
const championName =
  fifaWorldCup2026Snapshot.teams.find((team) => team.id === championTeamId)
    ?.name ?? "To be confirmed";

const tournamentStats = [
  { label: "Teams", value: fifaWorldCup2026Snapshot.teams.length },
  { label: "Matches", value: fifaWorldCup2026Snapshot.matches.length },
  { label: "Host venues", value: fifaWorldCup2026Snapshot.venues.length },
  { label: "Champion", value: championName },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-stadium text-foreground">
      <div aria-hidden="true" className="stadium-glow" />

      <header className="relative z-10 border-b border-line/80 bg-stadium/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="grid size-11 place-items-center rounded-full border border-highlight/50 bg-highlight/10 text-sm font-black text-highlight"
            >
              26
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-highlight">
                World Cup 2026
              </p>
              <p className="mt-1 font-semibold">World Cup Control</p>
            </div>
          </div>
          <p className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-secondary">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-highlight shadow-[0_0_12px_var(--highlight)]"
            />
            Tournament complete
          </p>
        </div>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-10 pt-14 sm:px-8 sm:pb-14 sm:pt-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-end">
          <div className="max-w-4xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-highlight">
              The completed tournament journey
            </p>
            <h1
              aria-label="The complete road, match by match."
              className="text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-6xl lg:text-7xl"
            >
              The complete road,
              <span className="block text-secondary">match by match.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-secondary sm:text-lg">
              Explore every result from the opening match in Mexico City to
              Spain&apos;s extra-time victory in the final.
            </p>
          </div>

          <dl className="grid grid-cols-2 overflow-hidden rounded-3xl border border-line bg-surface/80 shadow-2xl shadow-black/20 backdrop-blur">
            {tournamentStats.map((stat) => (
              <div
                className="border-b border-r border-line p-5 even:border-r-0 [&:nth-last-child(-n+2)]:border-b-0"
                key={stat.label}
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                  {stat.label}
                </dt>
                <dd className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <MatchExplorer snapshot={fifaWorldCup2026Snapshot} />

      <footer className="relative z-10 mx-auto flex w-full max-w-7xl flex-wrap justify-between gap-3 border-t border-line px-5 py-8 text-sm text-secondary sm:px-8">
        <p>Static official-data snapshot captured after the 2026 final.</p>
        <p>All kickoff times shown in Eastern Time.</p>
      </footer>
    </main>
  );
}
