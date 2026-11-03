# GameAnalytics

## Current build — 1.4.0-engagement

Use this build separately from 1.3.2-collection: the expanded tutorial and room/skill features change the experience. Profile thresholds remain unchanged. Earlier sections below describe historical rollouts.

- `PSF:v2:practice_step:{onboarding|optional}:step_{0..6}` now distinguishes move, fly, collect, return, activate skill, pass obstacle, and completion teaser. Earlier builds collapsed steps 4–6 into step_4; do not compare their stage counts directly.
- `Skill:Activate:{pink|blue|red|purple}:{normal|hard}`: one event with value 1 for an accepted skill activation. Failed button presses, cutscene completion, and practice are excluded.
- `Engagement:v1:{action}:{source}:{detail}` uses the following fixed paths. All values are 1 except the explicitly numerical summaries.

| action | source / detail | Meaning |
|---|---|---|
| room_open | room / first or revisit | Opening the room. Revisit means any subsequent room entry, including the same session. |
| room_select | room / color | Explicit resident selection; saved automatic selection is excluded. |
| focus_start | room / color | Entering the close-up interaction. |
| focus_end | room / color | Returning from close-up to the room. |
| focus_abandon | room / color | UI destroys the close-up without returning; no trust is awarded. |
| focus_touches | room / color | Accepted reactions during that visit, summed once at end/abandon; includes zero. |
| focus_seconds | room / color | Visible animation time during close-up, summed once at end/abandon; hidden-tab time excluded. |
| trust_gain | room / color | Actual trust increase on returning, capped at 10 per visit and 100 total. Only positive gains emit. |
| decor_open | room / group | Opening decoration controls. |
| decor_change | room / roomProps item ID or none | Accepted change, including removal; locked or unchanged choices excluded. |
| returns_open | title or room / group | Opening the cumulative return celebration from home or room. |

Colors are green/pink/blue/red/purple. No tap coordinates, personal names, arbitrary text, local IDs or dates are sent. Per-tap network events are not emitted. Repeated destroy/close calls do not duplicate interaction summaries. Closing/reloading the browser abruptly may lose summaries; focus_abandon is not guaranteed for browser departure. Trust events indicate the local in-memory award, not proof of durable storage when browser storage is blocked.

Room first/revisit is stored under `cosmii-room-visited-v1`. The first observed room entry after this instrumentation ships is first even for older players. Storage deletion/rejection can reset it. It is not next-day retention; use SDK retention for that. Room events can inherit the last gameplay mode dimension; do not interpret that dimension as the room's unlock mode.

For PSF, report distinct users with focus_start / NORMAL players in the same cohort, period, production environment and build. Analyze selected colors and trust gains separately; do not add starts, ends, taps and trust events into an interest count. When combining with character_select/result_detail, use a union of users. These actions indicate engagement, not proof of affection or improved PSF.

Verification: `tests/engagement.test.mjs` and `scripts/verify-engagement.mjs` cover distinct tutorial stages, bounded events, skill exclusions, actual room controls, trust gains, decoration, celebration, revisit and duplicate guards. Synthetic events are intercepted, never submitted to GA. Dashboard receipt still needs a real production check.

## Current profile gate — build 1.3.2-collection

Profiles require cumulative deliveries: blue 5, pink 10, red 20, purple 30; green is available immediately. Saved counts are preserved. Below-threshold profiles are locked again, including previously available first-delivery profiles. Loading old saves does not fabricate achievement events.

`InterestV2:profile_unlock` now fires on crossing the color's delivery threshold, together with `goal_complete`. They describe the same milestone and must not be summed. Status is preview/achieved; basic remains accepted for compatibility. Locked selections and result-detail clicks are still counted, but no profile_display is emitted while locked. Compare this build separately from earlier first-delivery profiles. Result popup events remain unchanged.

## Result social invitation — build 1.3.1-psf2

Every NORMAL/HARD run ending shows a dismissible SNS/LINE invitation over the result. Practice does not show it; returning from character details does not show it again.

- `Interest:social_popup_view:result_popup`: automatic exposure, value 1. Do not count as voluntary interest or `social_open`.
- `Interest:social_popup_close:result_popup`: explicit dismissal by close button, result button or Escape, value 1.
- `Interest:external_click:result_popup:{x|instagram|tiktok|line}:group`: actual external-link activation, value 1. LINE is currently unset/disabled and emits no event.
- Popup link response rate: unique users clicking a popup link / unique users exposed to the popup, for the same build, environment, mode and period. Union users across destinations; do not sum destination UUs. Clicks do not establish follow or purchase completion.

The automatic invitation changes the path to result details and retry. Compare build 1.3.1-psf2 separately from 1.3.0-psf2; the underlying PSF:v2 and InterestV2 definitions are retained.

Official JavaScript SDK 5.0.0 is pinned in package-lock.json and bundled in src/vendor. The build copies it with the game; no CDN is required at runtime. src/analytics-config.js holds the supplied SDK ingestion keys. As required by the browser SDK, these are included in the client build; they are not server-only credentials. Never put account/admin API credentials in this file.

## Dashboard

- Custom dimension 01: normal / hard.
- Custom dimension 02: development / production. Localhost and private LAN addresses use development.
- Build: 1.3.2-collection. Current profile gate and popup definitions are above; base PSF definitions, denominators and comparison limits: [PSF-IMPLEMENTATION.md](PSF-IMPLEMENTATION.md).
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

## Current character interest funnel (build 1.3.0-psf2)

Use `InterestV2:{action}:{source}:{color}:{status}`. Explicit `character_select` and `result_detail` are intent; `character_initial`, `profile_display` and `goal_display` are exposure. `profile_unlock` and `goal_complete` are committed achievements. Unmet colors are measured too. Dialog redraws do not duplicate exposure; result re-entry does not re-emit result_shown.

Old character_view and PSF result_detail are retired, not dual-emitted. Play/menu/social/external-click events retain their names; external destinations include TikTok. PSF:v2:blue_defense counts actual prevented loss after protection, not animation. normal_attempt and first_return_attempt distinguish first/retry/legacy. Return seconds are from the successful run's start. Old blue events overcounted harmless contacts and old character events omitted unmet interest: do not compare unfiltered old/new totals as an improvement.

Full tables: [PSF-IMPLEMENTATION.md](PSF-IMPLEMENTATION.md). Automated tests block external traffic and capture events in memory. No live initialization or production transmission was performed for PSF2.

## Historical character interest funnel (build 1.2.0; no longer current)

This section is retained as history. Story mode/events and its cited test were removed before PSF2. Its character_view formula must not be used for the current build.

Events use the existing SDK installation/session identity. No account names, external URLs, first-return dates, individual companion IDs or custom personal identifiers are sent.

- `Interest:play:normal|hard|story`: actual game start, excluding menu viewing and cinematic previews.
- `Interest:encyclopedia_open:title|result|home|encyclopedia`: entry source.
- `Interest:character_view:<source>:green|pink|blue|red|purple`: displayed profile, including initial selection.
- `Interest:social_open:<source>`: SNS/LINE menu opened.
- `Interest:external_click:<source>:x|instagram|line:<character|group>`: configured link activated. Disabled buttons emit no click event. General SNS entry uses group; a profile-origin link retains its selected character. This measures intent to visit, not follow or purchase completion.
- `Story:first_return:<character>:return`: first committed return of a species.
- `Story:friendship_unlock:<character>:episode1|episode2|fragment`: crossing 1/3/5 returns, once per newly earned reward.
- `Story:scene_start|scene_complete|scene_skip:<scene>`: fixed prologue/before-0..2/after-0..2/ending values.

Analysis definition: choose one identical period, production environment and build. Let P be distinct SDK users with an Interest:play event. Let R be distinct users with a character_view OR external_click event in that period. Interest response rate = size(P intersection R) / size(P). Use a union/deduplicated audience, NOT the sum of unique users for separate events; report no rate when P is empty. Target: 5%. Separately compare profile, SNS and LINE rates and entry sources. Preview-only users are excluded from P. Returning from a submenu may emit another view; use distinct-user cohorts rather than event counts.

No measurement result or improvement claim is available until real production usage is collected. Dashboard audiences/export joins must follow the above definition; this change supplies instrumentation, not a fabricated success metric. Build 1.2.0 distinguishes the story rollout from earlier 1.1.0 sessions.

`tests/story-progression.test.mjs` verifies bounded event paths. Browser suites intercept the adapter and inspect emitted events locally, while webdriver disables real submissions. SDK ingestion/dashboard receipt remains a separate production check.

## Room snacks
- Engagement:v1:snack_given:room:{green|pink|blue|red|purple}:{apple|cherry|cake}: value 1 per accepted snack; repeat presses during eating are ignored.
- Snacks are free, do not consume collected inventory, and award two pending trust points on acceptance. Returning commits taps + snacks*2, capped at 10 per visit and 100 total. Leaving before the animation ends still commits an accepted snack when returning to the room. Destroying the view without returning does not commit trust.
- focus_touches remains touch-only. trust_gain reports the actual combined increase. Snack actions are engagement, not proof of affection.


## 他ゲームへの導線（2026-11-03）
- `CrossPromo:v1:open:title`：ホームの「ほかのゲーム」を開いた回数。
- `CrossPromo:v1:store_click:<game_id>`：作品ごとのApp Storeリンク押下回数。
- game_id：`star_match` / `mogu_mogu` / `rhythm_dash` / `sudoku` / `cannon` の5種類のみ。
- 値は各1。クリック数であり、遷移先でのインストール完了は計測しない。AppsFlyerへは転送しない。
- 紹介カードは公式App Storeのタイトル・アイコンを使用。ユーザー操作時だけ外部リンクを開く。


## iOS local reminders (2026-11-03)

- `Reminder:v1:permission_request`, `permission_granted`, `permission_denied`, `disabled`: explicit notification settings actions.
- `Reminder:v1:opened:d1` / `Reminder:v1:opened:d7`: taps opening the app from the scheduled notification; fixed native identifiers and duplicate suppression.
- D1=24 hours / D7=168 hours after last play, not the install cohort. These events are NOT D1/D7 retention rates or confirmed delivery counts.
- See `IOS-NOTIFICATIONS-HANDOFF.txt` for physical-device validation.
