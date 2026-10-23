---
version: 1
slug: "src-app-app-page-tsx"
primary_target: "src/app/(app)/page.tsx"
related_targets: ["src/app/(app)/layout.tsx","src/app/login/page.tsx"]
---

Scope: the authenticated app (src/app/(app)/**) and login. Mode: Operate. Build path: code-led (chosen sketch: .impeccable/mocks/decision/assigned.html).
Audience/job: Rotem, Liat, Neta at the reception desk and on phones; find a customer by phone in seconds; morning picture in under 2 minutes; nothing unowned over 24h.
Constraints: Hebrew RTL, feminine copy, light+dark, mobile-first, logo stays. Branch only; the live site is under review.

## Direction contract
THESIS: The CRM reads like a cosmetics shade card: every treatment family is a named shade, and the day is a strip of swatches. It refuses the category default of a grey SaaS screen with KPI tiles and one blue accent.
OWN-WORLD: Matte card-stock white ground; porcelain sidebar; flat shade swatches (porcelain #F1E1D3 facials, blush #E7B7AE injections, honey #C99A6B laser, sand #E3C3A6 other, mocha #6E4A36 consultation) on cocoa ink #3B2A22; hairline taupe rules; Heebo light for display, bold for labels, three sizes only. Raises: palette total commitment (zoo map), visible extent counts in nav (acetate tab board), one-size discipline – rank by weight (timetable rack), hairline module density (Japanese high-density), found customer owns the phone screen (vertical feed).
STORY: Staff open the app and read the day as a palette – who comes when, for what, with whom – then see what waits without an owner, and act in one click.
FIRST VIEWPORT: Top bar with phone search and + לקוחה / + תור / + פנייה (cocoa primary). Greeting in Heebo Light 44px with weekday and date. One status strip (appointments today · new · in progress · unowned, garnet when >0). "פס הגוונים של היום": the day's appointments as swatches in time order, width by duration, gaps as empty card, legend of shades; day paging. Below: open tickets by owner with load bars, and the list waiting for an owner.
FORM: Cosmetics shade card – grounded list #6 (assigned by roll). seed:55ad917c8f22af93
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
