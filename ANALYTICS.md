# GameAnalytics

Official JavaScript SDK 5.0.0 is pinned in package-lock.json and bundled in src/vendor. The build copies it with the game; no CDN is required at runtime. src/analytics-config.js holds the supplied SDK ingestion keys. As required by the browser SDK, these are included in the client build; they are not server-only credentials. Never put account/admin API credentials in this file.

## Dashboard

- Custom dimension 01: normal / hard.
- Custom dimension 02: development / production. Localhost and private LAN addresses use development.
- Build: 1.1.0 (difficulty rebalance; update analytics-config.js for a release).
- SDK session events: automatic session/user tracking.
- App:Open: startup.
- Progression: Start:Endless:normal|hard and Fail on death. Leaving for the title is recorded as a design event, not a successful completion.
- Checkpoint:Count, Rescued, Points, TotalScore: one event of each type when a return is committed. Mode is the final event segment. All return points and rescued counts are saved synchronously at checkpoint crossing; individual bank animations never award or save points again.
- Damage:FriendsLost and Damage:LifeLost: actual damage only.
- Run:End:death|quit|leave|finish|retry: terminal reason, followed by Score, Rescued, MaxCarry, BestReturn, Seconds, Distance, Checkpoints summaries. The adapter prevents duplicate terminal events. A persisted pagehide (BFCache) keeps the same run active for restoration; a non-persisted departure ends it.

The game sets no custom personal user identifier; the SDK manages its own installation/session identifiers. No player names, email addresses, or input coordinates are added by the game.

## Verification

`npm test` checks lifecycle, duplicate prevention, checkpoint batching and SDK failure isolation.

`node scripts/verify-analytics.mjs` runs the real SDK in Chrome with intercepted GA requests. `--live-init` allows only authentication/initialization to reach GA; synthetic gameplay events remain intercepted. Automated browsers otherwise disable analytics. `?analytics=off` disables analytics for a manual QA session.

SDK loading/submission does not block the game. The wrapper bounds its pre-load queue; network retries and session delivery use the official SDK. Browser closure delivery is best effort. GA dashboard receipt is separate from localStorage score saving.

Official references:
- https://docs.gameanalytics.com/event-tracking-and-integrations/sdks-and-collection-api/open-source-sdks/javascript/
- https://docs.gameanalytics.com/event-tracking-and-integrations/sdks-and-collection-api/open-source-sdks/javascript/event-tracking/
