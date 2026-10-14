# Education Path

My instrument panel for a thirty-year path: where I stand, and what I do next. The vision lives in my career repository; this one holds the gates, the requisites, the dates, the knowledge and the record. It opens with the ceiling, what excellence looks like, because every page serves it.

Open `index.html` in a browser, or publish the folder with GitHub Pages. No build step.

## The files

| File | What it holds | When I open it |
| --- | --- | --- |
| `index.html` | The ceiling; today against the six stages; the next seven dated actions from every page; readiness toward the UBC and SFU MAs; senior A-credits; hours; this quarter's parcel. | Weekly. It replaces re-reading the plan. |
| `requisites.html` | Twelve requisites across the UBC MA, SFU MA and UBC PhD, with what my record holds and what I still earn, and the transcript arithmetic. | When an application question comes up, or a requirement changes. |
| `courses.html` | Six prerequisite courses, one per term, each taken at senior level where one exists: chosen course, fallback, registration deadline, grade, outline kept. | At each registration window; the day a grade arrives. |
| `parcels.html` | Thirteen quarters, October 2026 to December 2029: one theme, three to five items, one closing condition each. | At the start and end of each quarter; weekly to tick items. |
| `calendar.html` | The three-year strip with the current quarter marked, and every fixed external date with a countdown. | At the start of each term. |
| `gmh-track.html` | The Global Mental Health ladder: five optional, stackable rungs, the decision rules, and the three-year transfer clock on GHM202. | When another credential seems called for; the rules say whether it is. |
| `backups.html` | Thirteen bottlenecks in the order I meet them, each with the primary route, its backups, what still contributes, and the gate it sits on. | When a gate goes against me, before deciding anything. |
| `knowledge.html` | Ten bodies of knowledge: the primaries I read and cite (ticked as read), what each feeds, the test for holding it, and how far to trust the overview article in my project. | When choosing what to read next; before writing the conceptual paper or a statement. |
| `log.html` | Helping hours with a line of reflection each, and a one-line decision log. | After every shift, session or decision. |
| `data.js` | The single source of truth: ceiling, stages and gates, requisites, courses, calendar, deadlines, GMH rungs, backups, parcels, sources. | When a program changes a requirement or a date. |
| `knowledge.js` | The ten areas and their anchor texts. | When an anchor list changes. |
| `private.js` | The transcript inventory, grades only. Optional; the site runs without it. | After a transcript changes. |
| `app.js`, `style.css` | Shared behaviour and style. | Rarely. |

## How progress is stored

Status, notes, grades, hours and decisions live in the browser's `localStorage` under one key, so they persist between visits on the same device and browser. They do not sync between devices: **Export progress** downloads a JSON file and **Import** loads it elsewhere. A cleared browser clears the record, so I export regularly.

## Privacy

`private.js` holds GPA figures by level, with no identifiers; `.gitignore` excludes it and the progress exports. If this repository is ever public, those two stay local or the repository goes private.

## Keeping the data honest

- Program facts were checked on 14 October 2026 against the pages listed in `EDU.sources` in `data.js`; I re-check each spring. Term offerings for 2027–2029 are not yet published.
- Items marked **verify** carry a date or rule not yet confirmed from a single source: the LSHTM GHM202 December window, the Leeds application close, the ECPS non-degree deadline for EPSE 482, and the Vancouver Calendar wording of UBC's 12-credit A-range alternative (confirmed on the Okanagan College of Graduate Studies page).
- The stage gates are the closing conditions from my vision and sequence documents, with due dates added so they sort. Due dates are targets; the plan is keyed to conditions.
- The ten overview articles in my project are maps, not citations; the anchor texts in `knowledge.js` are what I cite.
