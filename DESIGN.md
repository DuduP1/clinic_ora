# DESIGN – "בוטיק זהב" (Boutique Gold)

The CRM reads as the clinic's reception day-book, not a SaaS dashboard. Espresso and champagne gold come from the lotus logo. Operate surface: standard controls and navigation; the world lends only type, palette, density and one signature move.

## Color (tokens in `src/app/globals.css`)
Strategy: Restrained ground + committed shell. The espresso sidebar owns its region; gold is used for markers, focus, the day-rail hairlines and links, never as decoration fill.

| Token | Light | Dark | Role |
|---|---|---|---|
| `cream` | #F7F6F3 | #141110 | working ground (porcelain, not cream paper) |
| `surface` | #FFFFFF | #1D1815 | cards, forms |
| `sand` | #EFECE6 | #29221E | secondary fill, hover |
| `ink` | #2A221D | #EFE8DF | text (espresso) |
| `muted` | #6F655D | #A99D92 | secondary text (≥4.8:1 on ground and sand) |
| `line` | #E4DED5 | #362D28 | hairlines |
| `accent` | #B08D57 | #CFA96A | gold: markers, focus ring, rail lines |
| `accent-strong` | #86662F | #E0C08A | gold text / links (≥4.9:1) |
| `primary` / `on-primary` | #2F251F / #FBF9F6 | #CFA96A / #1A1411 | primary action |
| `shell` / `on-shell` / `on-shell-muted` | #241C17 / #EFE7DC / #B9AB9A | #0F0C0B / … | desktop sidebar |

Status (jewel set, overriding Tailwind's sky/amber/emerald/red/stone): new = sapphire, in progress = honey, done = sage, cancelled = stone, alert = garnet. Badges use the 100 fill + 800 text pair.

## Type
- `font-display` = Bellefair (400 only, never bold): page titles, the greeting, card titles on the dashboard, customer name. Sizes: 4xl greeting/customer, 3xl page titles, 2xl section titles.
- `font-sans` = Heebo for every label, control, datum. Numbers in counts, times and tables use `tabular-nums`.

## Shape and depth
Cards: `rounded-xl` (12px), 1px `line` border, no shadow. Controls: `rounded-lg`; pills only for small toggles/filters. One elevation per element (border or shadow, never both).

## Components
- Buttons: primary (espresso / gold in dark), secondary (surface + border), ghost, danger. Focus: 2px gold outline, 2px offset.
- Icons: `components/icons.tsx` only – 24px grid, 1.8 stroke, round caps. No emoji or glyph icons.
- Status strip: one bordered strip of counters with a colored dot each; the "without owner" cell turns garnet when >0. Replaces KPI tile grids.
- Empty states: say what is missing and offer the next action.
- Loading: skeleton (`(app)/loading.tsx`); errors: `(app)/error.tsx` with retry; 404: `(app)/not-found.tsx`.

## Signature move – "היום ביומן"
`components/day-rail.tsx`: vertical hour rail (clinic hours 09:00–19:00, widened if needed), gold hairline per hour, appointments placed by start time and duration in status tones, overlapping ones split into lanes, a gold "now" line on today. Day paging with `/?day=YYYY-MM-DD`.

## Layout
Desktop: espresso sidebar (15rem) + porcelain work area (max 6xl). Mobile: bottom nav on surface, same tokens. Login: espresso brand panel with the gold logo beside a plain form.

## Don't
Gradient text, glass decoration, colored side borders >1px, KPI tile grids, emoji icons, `bg-rose`/fixed hex in components, bold Bellefair.
