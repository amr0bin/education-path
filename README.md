# Education Path

A small, dependency-free site that answers two questions at any point on the path: **where do I stand** and **what do I do next**. It is the operational companion to the career repository (`amr0bin/career`), which holds the vision; this one holds the gates, the requisites, the dates and the record.

Open `index.html` in a browser, or publish the folder with GitHub Pages. No build step.

## The files, in order of importance

| File | What it is for | Open it when |
| --- | --- | --- |
| `index.html` — **Where I stand** | Today's date against the six-stage path; the next seven dated actions across every page; readiness toward the UBC MA and SFU MA; helping hours. Computed from everything else. | Every week. This is the screen that replaces re-reading the plan. |
| `requisites.html` | The twelve requisites the UBC MA, SFU MA and UBC PhD read, each mapped to what is held and what is still to earn. Course-linked requisites turn done when their course does. | When an application question comes up, or a requirement changes. |
| `courses.html` | The six prerequisite courses, one per term, with the chosen course, its fallback, the registration deadline, grade and "outline kept". | At each registration window; the day a grade arrives. |
| `parcels.html` | Thirteen quarterly parcels, Oct 2026 → Dec 2029: one theme, three to five tickable items and a closing condition each, with the current quarter open. | At the start and end of each quarter; weekly to tick items. |
| `calendar.html` | Term-by-term grid Oct 2026 → Dec 2029 with "you are here", and every fixed external date with a countdown. | At the start of each term. |
| `gmh-track.html` | The Global Mental Health ladder — five optional, stackable rungs with the decision rules and the three-year transfer clock on GHM202. | Whenever competitiveness seems to call for another credential: the rules say whether it does. |
| `backups.html` | Thirteen bottlenecks in the order they are met, each with the primary route, its backups, what still contributes, and the stage gate it sits on. | When a gate goes against you — before deciding anything. |
| `log.html` | Helping hours with a line of reflection each (mirrors UBC's Para-Counselling Experience Chart) and a one-line decision log. | After every shift, session or decision. |
| `data.js` | The single source of truth: stages and gates, requisites, courses, calendar, deadlines, GMH rungs, sources. | When a program changes a requirement or date. Edit here; every page updates. |
| `app.js`, `style.css` | Shared behaviour and style. | Rarely. |

## How progress is stored

Status (to do / in progress / done), notes, grades, hours and decisions live in the browser's `localStorage` under one key, so they persist between visits on the same device and browser. They do not sync between devices on their own: use **Export progress** in the nav to download a JSON file, and **Import** on another device to load it. Export regularly; a cleared browser clears the record. Committing the exported JSON to this repository is a reasonable backup.

## Keeping the data honest

- Program facts were verified on 14 October 2026 against the pages listed in `EDU.sources` at the bottom of `data.js`. Re-check each spring; term offerings for 2027–2029 are not yet published.
- Items marked **verify** in the calendar carry a date that could not be confirmed from a single source (the LSHTM GHM202 13 December window; the Leeds application close).
- The stage gates are the closing conditions from the career repository's *My Vision* and *The Sequence*, with due dates added so they sort. Due dates are targets, not rules; the plan is keyed to conditions.

## What is deliberately not here

The vision, the portfolio model, the advisory council, the studio days and the financial structure stay in the career repository. This site is the instrument panel, not the map.
