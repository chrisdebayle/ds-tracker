# Handoff: Disposition Tracker (Outbound Engagement Reporting Tool)

## Overview
A tool for Chris DeBayle (Vigent Group LLC) to run cold-calling engagements under the **Disposition Science** framework (Ryan Reisert / Ronen R. Pessar): log daily call outcomes per rep, tag them to named target lists ("segments"), see live diagnostics against the framework's benchmarks, and give each active client two read-only links — a live dashboard/recordings view during the engagement, and a static diagnostic report at close-out.

Multi-tenant by design: one admin (Chris + subcontracted reps) manages several concurrent **client engagements**, each with its own reps, target lists, daily log, call recordings, and diagnostics.

## About the Design Files
The file in this bundle (`Disposition Tracker.dc.html`) is a **design reference built in an HTML prototyping tool** — it demonstrates layout, content, states, and interaction intent using mock/seeded data held in browser memory (no backend, no persistence). It is not production code to copy directly. **Recreate this design in your target stack's real environment** (React/Next.js, Vue, etc., with a real database and auth) using its established patterns — the HTML file is the spec for what to build, not the code to ship.

The design loads a small component library (`ChrisDebayleBrandComponents`) for structural pieces (data tables, section headers, callouts, checklists). Treat it as a **visual/behavioral reference** for those pieces — see `design-system-reference/` for the token values and component source used.

## Fidelity
**High-fidelity.** Colors, type, spacing, copy, and layout are final-intent. Recreate pixel-close using the target codebase's component library and the tokens listed below (do not invent new colors/type).

## Information Architecture
Two-mode app:
1. **Admin app** — full tool, sidebar nav, all clients. This is what Chris and reps use day to day.
2. **Client-facing portals** — two separate no-nav, single-client, read-only views, reached only via a link:
   - **Live View** (`?view=live&client=<id>`): Summary Dashboard + Call Recordings tabs. Meant to stay live and be revisited weekly throughout an active engagement.
   - **Report View** (`?view=report&client=<id>`): the static closeout diagnostic, delivered once at engagement end.

   **Important:** in the prototype, `client=<id>` is a plain, guessable slug (e.g. `jafar`) purely for demo routing. In production this must be an **unguessable, revocable share token** (e.g. signed JWT or random UUID mapped server-side to a client+scope), not the client's real ID — otherwise any client could enumerate or guess another client's link. Add expiry/revocation for the report link and a "regenerate link" action for admin.

## Screens / Views

### 1. Engagements (client list) — admin
- **Purpose:** switch between client engagements; entry point after login.
- **Layout:** header row (title + "+ New Engagement" button) → column-header row → stack of clickable row-cards (`grid-template-columns: 2.2fr 1fr 1.5fr 1fr 1.1fr auto`).
- **Columns:** Client (name + location, 2-line), Status (pill: Completed=gray/`--db-line` bg, Active=blue/`--db-tint-blue` bg, Paused=orange/`--db-tint-warm` bg), Window (date range or "Ongoing"), Volume (completed conversation count), Meeting + Activated %, "Open →" affordance.
- Clicking a row navigates to that client's Summary Dashboard.
- **Not wired in the mock:** "+ New Engagement" button (no create-client flow exists yet — see Gaps below).

### 2. Client / Engagement Setup — admin
- **Purpose:** one-time-per-engagement setup: client identity, reps, and target lists.
- **Layout:** single column, max-width 720px. Stacked labeled fields (uppercase 10.5px label, tinted input below).
- **Fields:** Client/Engagement Name, Start Date, End Date (or "Ongoing"), Primary Internal Owner, Dialer(s) in Use, SOW Reference, Notes (multi-line).
- **Reps on this Engagement:** pill chips (one per rep) + "+ Add rep" (dashed outline button, not wired).
- **Target Lists / Segments:** a card per list showing Name, "{logged} of {listTotal} logged", and the targeting Logic/rationale (free text) — plus an inline **"+ Add Target List"** form (Name, Logic, List Size → Add List button) that is fully functional in the mock (appends to session state).
- **Not wired:** the identity fields above are read-only display (no onChange) — the mock never persists an edit to client name/dates/owner/etc. Build real forms with save.

### 3. Daily Log — admin
- **Purpose:** the core data-entry screen. One row per rep per day.
- **Layout:** entry form card (top) + History table (bottom, horizontally scrollable).
- **Entry form fields (one row, 5 columns):** Date, Rep (select, options = this client's reps), **Target List** (select, options = this client's segments — new addition), Total Dials/Attempts, Talk Time (minutes).
- Below that: a 5-column × 2-row grid of the 10 disposition counters (Meeting, Activated, Not Now, Not Me, Referred, No Longer w/ Co., Not Interested, DNC, Nurture, NISL), each a labeled number input with its framework benchmark shown as a small caption.
- Footer of the card: live-computed **Total Completed Conversations** and **Raw Connect Rate** (both recompute on every keystroke) + **"+ Log Entry"** button.
- **History table** columns: Date, Rep, List, Dials, Completed, Connect Rate, then all 10 disposition counts, then Talk (min). New entries prepend to the top.
- **Behavior to preserve:** submitting resets only the dials/talk/disposition-count fields, keeping Date/Rep/List selected (so the same rep can log several days or lists quickly). Selecting a different client resets the Rep and List selections (each client has a different rep roster and list set).

### 4. Summary Dashboard — admin
- **Purpose:** auto-calculated KPIs and diagnostics, per the Disposition Science IF/THEN matrix.
- **Layout:** header (title + client-link controls top-right: "Preview Client View" / "Copy Client Link" buttons, and a small caption stating what's shared) + range toggle (All-Time / Last 30 Days / Last 7 Days) + KPI strip (6 cards) + optional below-minimum-sample banner + Disposition Breakdown table + Composite Diagnostic Metrics (2 cards) + Segment Breakdown (one card per target list).
- **KPI cards (6, equal-width row):** Total Dials/Attempts, Total Completed Conversations, Meetings Booked, Raw Connect Rate, Meeting + Activated %, Not Me + Referred % (the last two color-coded pass/fail against benchmark).
- **Below-minimum banner:** shows only if `totalCompleted < 200`, per the framework's stated minimum sample size.
- **Disposition Breakdown table:** Disposition / Count / % of Completed / Benchmark / Status, with rows flagged (tinted) when outside benchmark.
- **Composite cards:** Meeting+Activated (floor 20%/target 25%+) and Not Me+Referred (≥20% = list/titles signal), each with a status pill.
- **Segment Breakdown cards:** per target list — name, "{logged} of {listTotal} logged · {pct}%", *targeting logic* (admin-only, italic caption), top-4 disposition mix as horizontal bars, and a free-text "read" line.
- **Gap flagged for dev:** the Last 30 Days / Last 7 Days toggle in the mock is a **fixed-percentage simulation** (multiplies all-time counts by 0.42 / 0.14) — it does not actually filter by date. Production must filter real Daily Log rows by their `date` field against the selected window.

### 5. Call Recordings — admin
- **Purpose:** index of recordings for connected calls; the audio itself lives in Drive/the dialer, never uploaded here.
- **Layout:** header + "+ Add Recording" button (not wired) + table.
- **Columns:** Date, Rep, Contact, Company, Duration (min), Consent (Yes/No), Notes.
- **Decision already made with the client:** recording source is **link-only** (a Drive/dialer URL pasted in), not a file upload — keep the tool link-based to avoid heavy media storage/bandwidth costs.

### 6. Disposition Reference — admin
- **Purpose:** static, always-available reference so reps can self-serve the framework rules without leaving the tool.
- **Content (all static, sourced verbatim from the Disposition Science framework doc):** the 10 Dispositions table (Disposition/Definition/Benchmark), the 3 I's (Intent/Interest/Intrigue) as 3 cards, the 6 Most-Confused-Pairs table (decision rules), and a "Logging Discipline" checklist item.
- No admin editing needed here — this content should ship as seed/reference data, not a CMS.

### 7. Diagnostic Report — admin
- **Purpose:** the end-of-engagement deliverable, structured like a lightweight version of a real closeout report.
- **Layout:** header (title + client-link controls: "Preview Report" / "Copy Report Link" / "Export PDF") then 5 numbered sections (using the Section component): 01 Snapshot (3 KPI cards + one Callout headline quote), 02 Distribution (full disposition table sorted by count desc, with a "Signal" column mapping each disposition to its pillar), 03 Failure Modes (ranked list, only shown if the client has `findings` — currently only the seeded "Jafar AI" client does), 04 Segments (compact read-only cards, no targeting-logic exposed), 05 Next Steps (ranked recommendations checklist).
- If the client is below the 200-conversation minimum, sections 03–05 are replaced with a single "build sample size first" notice.
- **Gap flagged for dev:** "Export PDF" button has no handler in the mock — wire to your PDF/print pipeline.

### 8. Live Client View — client-facing (no admin nav)
- **Purpose:** what an active client sees when they click their live link, any time during the engagement.
- **Layout:** centered column (max 1200px), header (practice name/eyebrow, client name, engagement window, "Updated as calls are logged" note), a 2-tab switcher (Summary Dashboard / Call Recordings), then **exactly the same Dashboard and Recordings content as the admin screens minus the client-link controls and minus the segment "logic" caption** (targeting rationale is admin-only — do not expose it here).
- A small "Exit preview" link only exists so admin can test the view from within the app; the real client-facing deployment of this route should not have that link (or any way back into admin).

### 9. Report View — client-facing (no admin nav)
- **Purpose:** the static, delivered-once closeout report, reachable via its own separate link.
- **Layout:** centered column (max 960px), header (practice name/eyebrow "Weekly Engagement Report" — copy note: relabel this eyebrow for the Report view specifically, e.g. "Engagement Closeout Report", since it's not the weekly one), then the same 5 numbered sections as the admin Report screen.

## Interactions & Behavior
- **Client switching** resets the Daily Log form's Rep and Target List selections (different clients have different rosters/lists) but not the Date.
- **Daily Log submit** appends a new row to that client's log (prepended, newest first) and resets only the count/dials/talk fields.
- **Add Target List** appends a new segment with zero base counts; it starts contributing to the Dashboard the moment any Daily Log entry is tagged to it.
- **Segment math (important for backend design):** each segment carries a `baseCounts` object (the historical disposition counts already attributed to that list before this tool was adopted, entered once by admin or migrated from existing CRM data) plus whatever Daily Log entries get tagged to it going forward. The Dashboard/Report show `base + live` combined. This lets a real campaign's already-collected history and this tool's forward logging combine into one number without double-counting or requiring a full data migration.
- **Copy Client Link / Copy Report Link:** builds `<origin><path>?view=live&client=<id>` or `?view=report&client=<id>`, copies to clipboard (`navigator.clipboard`), falls back to `window.open` if clipboard API unavailable. Shows "Link Copied!" for 2 seconds. **Replace `<id>` with a real share token in production** (see IA note above).
- **Preview Client View / Preview Report:** in-app shortcuts that flip the same view state without leaving the tab, purely for admin QA — fine to keep as a "preview" affordance in production too.
- No loading or error states exist in the mock (all data is synchronous/local) — production needs standard loading skeletons and error/empty states for every table and form.

## State Management (mapped from the prototype's local state — translate to real app state/DB)
- `activeClientId` — current engagement in admin view.
- `range` — All-Time / Last 30 / Last 7 for the Dashboard (needs real date filtering — see Gap above).
- `portalView` — `admin` / `live` / `report`, driven by URL query params `view` + `client` on load.
- Per-client: `reps[]`, `segments[]` (each with `id, name, logic, listTotal, baseCounts`), `dailyLog[]` (each row: `date, rep, segmentId, dials, talkTime, counts{10 keys}`), `recordings[]`.
- Daily Log form state: `logDate, logRep, logSegment, logDials, logTalk, logCounts{10 keys}`.
- New-segment form state: `newSegName, newSegLogic, newSegSize`.

## Design Tokens
All from the `ChrisDebayleBrandComponents` design system — see `design-system-reference/` for the full token file and component source. Key tokens used throughout:
- Colors: `--db-primary` #0a66c2, `--db-accent` #f97316, `--db-accent-700` #c85d12, `--db-dark` #1c1f24, `--db-ink-soft` #3a3f46, `--db-light` #f8fafc, `--db-paper` #ffffff, `--db-line` #e4e7eb, `--db-muted` #70767f, `--db-tint-blue` #f3f8fd, `--db-tint-warm` #fbf4ef, `--db-ground` #0b0e11 (admin sidebar bg), `--db-card-dark` #171b20, `--db-ink-head` #f4f6f8, `--db-ink-2` #a8b0b9, `--db-muted-2` #7e858e, `--db-pass` #1b6b3a (green, "On target"), `--db-fail` #b4231f (red, "Flagged").
- Radius: `--db-radius` 6px, used on every card/input/button.
- Type: `--db-font-display` "Space Grotesk" (headings, labels, numerals, nav) / `--db-font-body` "Inter" (everything else) — never mixed.
- Spacing: no formal scale token; the design uses an ad-hoc but consistent set (8/10/12/14/16/18/20/24/28/32px) — treat 8px as the base unit.

## Assets
No images/icons — the design deliberately uses no iconography (text labels, a colored left accent bar for active nav, and colored status pills/dots stand in for icons throughout, consistent with the design system's no-icon voice).

## Data / Business Logic Reference
The **Disposition Science framework** (10 dispositions, their definitions and benchmarks, the 6 confused pairs, the IF/THEN diagnostic matrix, and the composite metrics) is fully documented in the project's `Disposition Science (DS)_Framework.md` — treat that file as the authoritative spec for all benchmark thresholds, status logic (`good`/`watch`/`neutral` per disposition — see `statusFor()` in the prototype's script), and the Reference screen's static content. The original spreadsheet template (`Disposition_Tracker_TEMPLATE.xlsx`) and a real closeout report example (`Jafar AI - Outbound Diagnostic - 2026-08-14.pdf`) are also in the project's uploads and show the real-world shape of a Daily Log and a full diagnostic report respectively.

## Known Gaps / Recommendations (build these — not faked in the mock)
1. **No backend/persistence.** Everything lives in in-memory component state; a refresh loses all data. Needs a real database (clients, reps, segments, daily_log_entries, recordings) and API.
2. **No auth.** Admin app needs login; client-facing links need signed/revocable tokens, not guessable client IDs (see IA note).
3. **"+ New Engagement", "+ Add rep", "+ Add Recording"** buttons are UI-only placeholders — build the create/edit flows behind them.
4. **Client Setup identity fields** (name, dates, owner, dialer, SOW, notes) are display-only in the mock — build real editable forms with save/validation.
5. **Dashboard's 30-day/7-day range is simulated,** not real date filtering — implement against actual `date` fields on Daily Log rows.
6. **Export PDF** on the Report screen has no handler — wire to a real PDF/print pipeline (the report's HTML/CSS structure is print-friendly by design: numbered sections, no interactive-only elements).
7. **Segment `baseCounts` vs `listTotal`** need a clear data-entry/import story for real engagements (CSV import from CRM export is likely, per the reference PDF's HubSpot-export workflow) — the mock hand-seeds these.
8. Consider **soft-delete/archive** for completed engagements and **edit/remove** for reps and target lists (not present in the mock).
9. **Multi-user/role permissions** if subcontracted reps get their own logins (mock assumes a single admin operating the whole tool; reps are just a name field in a dropdown, not real accounts).

## Files
- `Disposition Tracker.dc.html` — the full design reference (all 9 screens/views described above, in one file for prototyping purposes only — split into real routes/components in the target codebase).
- `design-system-reference/chris-debayle-brand-components/` — the design system's token CSS, compiled component bundle, and per-component docs (`components/*/*.prompt.md`) referenced by the design.
