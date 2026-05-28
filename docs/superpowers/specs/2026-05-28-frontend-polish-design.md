# Frontend Visual Polish — Design Spec

**Date:** 2026-05-28
**Scope:** Visual polish pass across the headpat-place-web app. No new backend features. One small backend touch already exists (`profile.list`). Everything here is presentation-layer.

## Direction

**Personality:** Social & bold — big imagery, bold display type, vibrant gradients in decorative areas, brand-green for action. Reference points: Twitter/Instagram profile pages, modern social product landing.

## Style tokens

Added to `src/styles/globals.css` under `@theme inline` (and `:root` / `.dark` var blocks where needed). Keep dark-mode parity.

| Token | Value | Use |
|-------|-------|-----|
| `--brand` | `#008055` | primary CTA, follow buttons, focus rings, link hover, active sidebar item, status dots |
| `--brand-foreground` | `#ffffff` | text/icons on brand surfaces |
| `--brand-soft` | `rgba(0,128,85,.18)` | tag backgrounds, subtle highlights, hover tints |
| `--sunset-1` | `#fbbf24` | gradient stop 1 (amber) |
| `--sunset-2` | `#fb7185` | gradient stop 2 (pink) |
| `--sunset-3` | `#a855f7` | gradient stop 3 (purple) |
| `--sunset-gradient` | `linear-gradient(135deg, var(--sunset-1), var(--sunset-2) 50%, var(--sunset-3))` | default banners, hero backgrounds, decorative blobs |

**Integration rule (chosen: "two-tone brand"):** Decorative gradients stay sunset-warm. Brand green is the consistent *action* color everywhere (CTAs, avatar ring, tag borders, focus). Banners pop warm; identity/action reads green.

**Typography:** system stack. Weights — 800 for display titles (h1, profile/community names), 700 for h2, 600 for buttons/labels. Headings get `letter-spacing:-0.02em`.

**Radii:** cards 14px, buttons 8px, badges/tags 999px (pill), avatars 50%.

**Motion:** card hover = `scale(1.01)` + `brightness(1.05)`, 150ms ease. Image tiles get hover zoom (`scale(1.04)` on the `<img>`, container `overflow:hidden`). Respect `prefers-reduced-motion`.

**Default banner:** when a user/community has no `bannerFileId`, render `--sunset-gradient` so cards/headers never look empty.

## Shared components / utilities

- **`GradientBanner`** — small component: renders the stored banner image (via existing `StorageImage` / `useStorageUrl`) or falls back to `--sunset-gradient`. Used by profile, community detail, community cards.
- **CSS utility classes** in globals.css: `.bg-sunset`, `.text-brand`, `.btn-brand` (or rely on Tailwind arbitrary values referencing the vars). Prefer extending tokens so existing shadcn `Button` variants can opt into brand via `className`.
- Existing `StorageImage` and `AvatarBannerUpload` stay as-is.

## Per-page plan

**Tier 1 (showpiece):**
1. `/` (`_app/index.tsx`) — **Discover hub.** Sunset hero with brand CTA + "Welcome back, <name>". "Popular communities" row (top 3 by `followersCount` from `community.list`). "Suggested users" row (top 3 from `profile.list`).
2. `/user/$profileUrl` — banner (sunset default) + 64px avatar overlapping it, 800-weight name, brand-green Follow CTA, social handles as pill tags.
3. `/community/$communityId` — same banner/avatar overlap pattern, brand Follow, stat strip (followers · events).
4. Auth shell — `/login`, `/register`, `/forgot-password`, `/reset-password`, `/i/verify-email`, `/i/reset-password`, `/login/mfa`: centered card on a sunset-gradient backdrop, polished OAuth button grid, brand-green primary button.

**Tier 2 (lists & feeds):**
5. `/community` — banner-led cards (banner strip + offset avatar + bold name + clamp desc + follower count + tag pills + hover lift).
6. `/users` — avatar + bold name + bio-clamp cards, hover lift.
7. `/gallery` — image-first grid, hover zoom, title overlaid bottom-left, NSFW badge top-right.
8. `/notifications` — activity-feed treatment: avatar + bold actor + action + relative time rows; keep "mark all read".

**Tier 3 (forms & detail):**
9. `/account` (general tab) — 3-card stat row (Followers / Communities / Unread) above existing forms; restyle section headers; keep frontpage/socials tabs functional.
10. `/gallery/upload` — drop-zone styled file input + preview thumbnail + brand submit.
11. `/events/$eventId` — hero header (date/location), brand attend CTA, capacity meter bar.
12. `/messages/$conversationId` — refined bubbles, brand-green own messages, sender avatars.

**Tier 4 (inherit only):**
13. `/legal/*`, `/support`, `/pawcraft` — inherit new type tokens; no structural change.

**Sidebar (light touch):** active nav item uses `--brand`; brand accent on logo/footer region. Keep structure, links, and behavior. No layout rework.

## Out of scope

- Map page (intentional placeholder)
- Full sidebar redesign (light touch only)
- Any backend/schema changes
- New routes or features

## Testing / verification

- After each tier: `bun run dev`, load each touched route in the browser, confirm SSR 200 + no console errors + visual check in both light and dark mode.
- Backend test suite (`bun test` in headpat-place-api) must stay green (it shouldn't be affected — web-only changes).
- Spot-check responsive at narrow width (sidebar collapses; cards reflow to 1 column).

## Risks

- Hover/scale transforms can cause layout shift — use `transform` only, never width/height.
- Gradient text (`background-clip:text`) needs a solid fallback color for unsupported browsers; we chose two-tone (no gradient text required), so low risk.
- Dark-mode contrast on sunset gradients — verify white text on amber stop meets AA; darken amber stop slightly if needed.
