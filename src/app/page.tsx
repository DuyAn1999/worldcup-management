const tournamentStages = [
  "Group stage",
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-stadium text-foreground">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-highlight">
              World Cup 2026
            </p>
            <p className="mt-1 font-medium">World Cup Control</p>
          </div>
          <p className="rounded-full border border-line px-3 py-1 text-sm text-secondary">
            Foundation ready
          </p>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-highlight">
            Tournament journey
          </p>
          <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">
            Every team has a road to the final.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-secondary sm:text-lg">
            The application foundation is in place. Tournament data and feature
            behavior will be added only in their approved checkpoints.
          </p>
        </div>

        <ol
          aria-label="Tournament stages"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"
        >
          {tournamentStages.map((stage, index) => (
            <li
              className="border-l-2 border-line px-4 py-3 first:border-highlight"
              key={stage}
            >
              <span className="block text-sm text-secondary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-1 block font-medium">{stage}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
