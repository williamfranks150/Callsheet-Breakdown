# Callsheet Breakdown

Production-day planning with multi-unit call sheets, schedules, sides, original production maps, travel, weather, timing preferences and a persistent timer.

## Source layout

- `app/`: actual application JavaScript and styles recovered from the working application.
- `src/index.template.html`: original application markup with private content replaced by tokens.
- `scripts/build.mjs`: restores privately supplied content and builds the app.
- `scripts/test.mjs`: dependency-free regression checks.
- Root `index.html`: installation/redirect entry only. It is not the application source.

No third-party runtime dependencies. Node.js 20.11+ runs the build and checks.

## Private build

1. Supply `.private/values.json`, `.private/bootstrap.json`, and `.private/assets/` through a secure channel. These files are intentionally not present in this public repository.
2. Run `npm test`.
3. Run `npm run build`.
4. Deploy `dist/` to authenticated private hosting. Never deploy it to public GitHub Pages: it contains production documents and personal information.

The current private deployment preserves the existing URL and access controls. Its data and original documents stay on that protected deployment. Reusable code assets can be published separately through GitHub Pages, without publishing production content.

## GitHub workflow

The Pages workflow tests and publishes only the public launcher, icons and reusable `app/` assets. Private content never enters that artifact. It does not synchronize Gmail and does not publish private documents. The authenticated application loads its own protected data. Source-data updates remain a separate authenticated publishing operation.

## Timer and device behaviour

Timers store an absolute completion timestamp. Returning from sleep, a locked screen, background suspension and a reload recalculates the remaining time. A website cannot guarantee audible alerts while the operating system suspends it; use a system alarm for a critical deadline.

## Data accuracy

Production confirmation, personal booking and personal call times are separate fields. Missing dates are unspecified, not assumed days off. Only verified personal IMDb profile URLs are linked. Unit-specific documents and assignments remain separate.
