# ArtPic — Design system: Clean gallery

Hebrew, RTL, mobile first (75% of traffic). Chosen direction (2026-11-12): **clean gallery**. White space, black type, square corners, and the customer's photo as the only color on the page.
The direction comes from the product and the current site, not from a study of competitor sites (UXKIN was not connected).
Tokens live in `prototype/styles.css` `:root`; pages use the names, never raw values.

## Principles

1. **Photo first.** The buyer's own photo is the hero on every screen. Before they upload one, a sample photo stands in.
2. **True scale.** Sizes are always shown on a wall to real cm scale, next to furniture of known width (a 210 cm sofa, a 160 cm bed, a 160 cm table).
3. **Nothing is locked.** Material, shape, size and finish can all be changed on one screen. The URL follows the selection (`/product-page/<slug>`).
4. **The page is the gallery wall.** The UI is black, white and grey, so the photo is the only color. Color in the UI means something: a sale, a warning, success.
5. **One action per screen.** One black primary button per screen. On the studio screen it sits in a sticky bottom bar with the live price.
6. **No AI illustration.**

## Color

| Token | Value | Role |
|---|---|---|
| `--bg` | `#FFFFFF` | page background |
| `--surface` | `#FFFFFF` | cards, sheets, buy bar |
| `--surface-2` | `#F4F4F2` | quiet fills: chips, table heads, bands |
| `--text` | `#111111` | text, icons, promo bar background |
| `--muted` | `#5F5F5F` | secondary text (6.4:1 on white) |
| `--border` | `#E4E4E1` | dividers, card and chip outlines |
| `--primary` | `#111111` | primary buttons, selected chips, links |
| `--on-primary` | `#FFFFFF` | text on primary |
| `--accent` | `#B08D57` brass | **non-text only**: step numbers, the "new" tag background (with `#111` text), a thin rule. Never text on white (3:1). |
| `--sale` | `#B42318` | sale %, discount text (5.9:1) |
| `--success` / `--warning` | `#2E7D4F` / `#9A6700` | photo quality good / low |
| `--wall` `--wall-2` `--floor` | `#F1F0EC` `#E9E7E1` `#D9D2C5` | room scene background |
| `--furniture` `--furniture-2` `--wood` | `#3A3A38` `#262625` `#BFA98A` | charcoal furniture, pale oak |

No dark mode: the product photos have to look true to life, on a light wall.

## Typography

One family: **Heebo** (Hebrew and Latin, from Google Fonts), weights 300 / 400 / 500 / 700.

| Style | Mobile → desktop | Line height | Weight | Use |
|---|---|---|---|---|
| display | 34 → 52 | 1.1 | 300, tracking −0.03em | home hero |
| h1 | 26 → 36 | 1.15 | 300 | page and product titles |
| h2 | 20 → 24 | 1.25 | 300 | section titles |
| h3 | 17 → 19 | 1.3 | 300 | card titles |
| label | 15 | 1.3 | 700 | field labels (חומר, גודל, גימור) |
| body | 16 | 1.55 | 400 | text (never smaller) |
| small | 14 | 1.45 | 400 | hints, prices on chips |
| micro | 12 | 1.4 | 400 | room scene captions only |

Headings are light and large. Weight is used for prices and labels, not headings. Prices use tabular numbers. Lines run 60 to 75 characters.

## Spacing and layout

4px base: `4 8 12 16 24 32 48 64 96`. Side gutter is 16px on mobile and 32px from 900px. Content max width is 1120px.
Sections are 48px apart on mobile and 80px on desktop. Touch targets are at least 44px.
The studio screen is one column on mobile, with the room stage sticky at the top. From 900px wide it becomes two columns: the stage on the start (right) side, controls on the other.

## Shape and depth

- Radius: `--r-s` 0, `--r-m` 2px, `--r-l` 4px for prints, photos and the cards that show them: square, like a printed frame. `--r-btn` 6px for everything you tap (buttons, chips, segmented controls, size chips), so it reads as tappable and a little warmer. Never pill-shaped.
- No shadows on UI. Separation comes from a 1px `--border` line. The only `--shadow-2` is a 1px line above the sticky buy bar.
- Shadows appear only inside room scenes, under the prints, to show depth on the wall.

## Components

- **Buttons.** Primary: black fill, white text, 48px tall (52px in the buy bar), weight 500. Secondary: 1.5px black outline. Quiet: underlined text link. States: hover darkens to 92% brightness, focus shows a 3px ring (`--primary` at 35%) with a 2px offset, disabled is 40% opacity.
- **Upload button.** A primary button with an upload icon plus a hidden file input. It accepts JPG, PNG, WEBP and HEIC.
- **Chips / segmented control.** 44px tall, 1.5px `--border` outline. The selected chip is filled black. Used for room, shape, orientation and frame type.
- **Material rail.** Square-cornered cards showing the buyer's photo on each material, with the name and a "from" price. The selected card has a black border.
- **Size rail.** A horizontally scrolling row of size chips. Each shows a proportional rectangle, the size in cm (always LTR-isolated, e.g. `60×40`) and the price. Low quality for the buyer's photo gets a `--warning` dot.
- **Room stage.** An SVG drawn in cm (viewBox = cm). Scenes: living room, bedroom and kitchen for prints; a sideboard for story blocks; stairs and a narrow wall for canvas walls. A dimension line runs above the print, and a caption gives the furniture width.
- **Buy bar.** Fixed to the bottom. Shows the sale price, the crossed-out list price, a one-line summary and the black "הוספה לסל" button.
- **Cart sheet.** Slides up from the bottom on mobile, from the side on desktop. Lines show the buyer's photo thumbnail, title, finish and price, plus progress towards free shipping and the promo.
- **Header.** A black promo bar, then the logo, menu and cart, with a 1px rule below. The desktop nav lists the materials.
- **Footer.** Black. Links every material page and canvas wall (for SEO).
- **Tables.** Size and price tables on category pages: a 1px border, a `--surface-2` header, size links in black weight 500.

## Imagery and icons

- The photo comes first: the customer's photo, or a neutral sample landscape before upload. No stock lifestyle photos in the flow itself.
- Room scenes are flat drawings: off-white wall, charcoal furniture, pale oak. They are drawn at true scale and kept quiet, so the print stands out.
- Icons: 1.75px line icons (Lucide style), drawn as inline SVG. No emoji as icons.

## Not allowed

Pill-shaped buttons, drop shadows on cards, gradients, glassmorphism, colored headings, brass used as text, carousels for primary content, three identical feature cards, and any AI-illustration upsell.
