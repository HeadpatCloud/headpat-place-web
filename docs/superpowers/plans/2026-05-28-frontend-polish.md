# Frontend Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The design-craft superpowers skills (`frontend-design`, `polish`, `colorize`, `animate`) MAY be invoked during page tasks for styling quality.

**Goal:** Apply a cohesive "social & bold" visual pass across headpat-place-web — sunset-gradient decorative surfaces + brand-green (#008055) actions — without changing backend behavior.

**Architecture:** Add design tokens + a few shared presentation utilities to `globals.css`, build one shared `GradientBanner` component, then restyle pages tier by tier. Brand green is already wired as `--primary` (`hsl(160 100% 25%)` ≈ #008055) in both themes — reuse it; only the sunset gradient tokens are net-new.

**Tech Stack:** TanStack Start, Tailwind v4 (`@theme inline`), shadcn UI, next-themes, TanStack Query, existing `StorageImage` / `useStorageUrl` helpers.

**Verification note:** This is visual work; there are no meaningful unit tests for "looks right." Each page task's verification = run `bun run dev`, load the route in a browser, confirm HTTP 200 + zero console errors + a visual check in BOTH light and dark mode + narrow-width reflow. The backend `bun test` suite must remain green (web-only changes shouldn't touch it; run once at the end to confirm).

**Servers during execution:** API already runs on `:8787` (`cd headpat-place-api && bun run dev`). Web dev server on `:3000` (`cd headpat-place-web && bun run dev`). Log in with `local@test.dev` / `LocalTest123`.

---

### Task 0: Design tokens + shared utilities + GradientBanner

**Files:**
- Modify: `src/styles/globals.css` (append to `@theme inline` block and after the `.dark` block)
- Create: `src/components/GradientBanner.tsx`

- [ ] **Step 1: Add sunset tokens to the `@theme inline` block**

In `src/styles/globals.css`, inside the existing `@theme inline { ... }` block (after the `--color-link` line near line 43), add:

```css
  --color-brand: var(--primary);
  --color-brand-foreground: var(--primary-foreground);
  --color-sunset-1: #fbbf24;
  --color-sunset-2: #fb7185;
  --color-sunset-3: #a855f7;
```

- [ ] **Step 2: Add gradient + motion utilities after the view-transition block at the end of the file**

Append to the end of `src/styles/globals.css`:

```css
.bg-sunset {
  background-image: linear-gradient(
    135deg,
    var(--color-sunset-1),
    var(--color-sunset-2) 50%,
    var(--color-sunset-3)
  );
}

.card-hover {
  transition: transform 150ms ease, filter 150ms ease;
}
.card-hover:hover {
  transform: scale(1.01);
  filter: brightness(1.05);
}

.zoom-parent { overflow: hidden; }
.zoom-img { transition: transform 200ms ease; }
.zoom-parent:hover .zoom-img { transform: scale(1.04); }

@media (prefers-reduced-motion: reduce) {
  .card-hover, .zoom-img { transition: none; }
  .card-hover:hover { transform: none; filter: none; }
  .zoom-parent:hover .zoom-img { transform: none; }
}
```

- [ ] **Step 3: Create the GradientBanner component**

Create `src/components/GradientBanner.tsx`:

```tsx
import { useStorageUrl, type StorageKind } from "@/components/StorageImage"

type Props = {
  kind: Extract<StorageKind, "banner" | "community-banner">
  fileId: string | null | undefined
  className?: string
}

export function GradientBanner({ kind, fileId, className }: Props) {
  const q = useStorageUrl(kind, fileId)
  const base = className ?? "h-48 w-full rounded-lg"
  if (fileId && q.data) {
    return (
      <div
        className={`${base} bg-cover bg-center bg-muted`}
        style={{ backgroundImage: `url(${q.data.url})` }}
      />
    )
  }
  return <div className={`${base} bg-sunset`} />
}
```

- [ ] **Step 4: Verify the dev server compiles and tokens resolve**

Run: `cd G:/git/headpat/headpat-place-web && bun run dev` (background), then `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/`
Expected: `200`. Open `/` in browser, confirm no console errors. The `.bg-sunset` class won't be visible yet (not used) — this step only confirms the CSS compiles.

- [ ] **Step 5: Commit**

```bash
git -C G:/git/headpat/headpat-place-web add src/styles/globals.css src/components/GradientBanner.tsx
git -C G:/git/headpat/headpat-place-web commit -m "feat: sunset design tokens, hover utilities, GradientBanner component"
```

---

### Task 1: Home — Discover hub

**Files:**
- Modify: `src/routes/_app/index.tsx` (full rewrite of the component)

- [ ] **Step 1: Rewrite the home component**

Replace the body of `src/routes/_app/index.tsx`. It must: show a sunset hero with the signed-in name + a brand CTA linking to `/gallery`; a "Popular communities" row from `orpc.community.list` (slice top 3); a "Suggested users" row from `orpc.profile.list` (input `{ limit: 3 }`). Use `GradientBanner` for community banner thumbnails and `StorageImage` (kind `avatar` / `community-avatar`) for avatars. Logged-out users see the hero + a "Log in" CTA only.

Key structure:

```tsx
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { GradientBanner } from "@/components/GradientBanner"
import { StorageImage } from "@/components/StorageImage"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSession } from "@/lib/auth-client"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/")({ component: Landing })

function Landing() {
  const { data: session } = useSession()
  const communities = useQuery(orpc.community.list.queryOptions({ input: {} }))
  const users = useQuery(orpc.profile.list.queryOptions({ input: { limit: 3 } }))
  const topCommunities = (communities.data ?? []).slice(0, 3)
  const topUsers = (users.data ?? []).slice(0, 3)

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <section className="bg-sunset relative overflow-hidden rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {session?.user ? `Welcome back, ${session.user.name || "friend"} ✨` : "Welcome to Headpat"}
        </h1>
        <p className="mt-2 max-w-md text-white/85">
          Explore communities, share to the gallery, and keep up with friends.
        </p>
        <Button asChild className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to={(session?.user ? "/gallery" : "/login") as never}>
            {session?.user ? "Browse gallery" : "Log in"}
          </Link>
        </Button>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Popular communities</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {topCommunities.map((c) => (
            <Link key={c.id} to={`/community/${c.id}` as never}>
              <Card className="card-hover overflow-hidden">
                <GradientBanner kind="community-banner" fileId={c.bannerFileId} className="h-20 w-full" />
                <CardContent className="flex items-center gap-3 pt-3">
                  <StorageImage kind="community-avatar" fileId={c.avatarFileId}
                    className="h-9 w-9 rounded-full object-cover bg-muted"
                    fallback={<div className="h-9 w-9 rounded-full bg-muted" />} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.followersCount} followers</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Suggested users</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {topUsers.map((u) => (
            <Link key={u.userId} to={`/user/${u.profileUrl}` as never}>
              <Card className="card-hover">
                <CardContent className="flex items-center gap-3 pt-6">
                  <StorageImage kind="avatar" fileId={u.avatarFileId}
                    className="h-10 w-10 rounded-full object-cover bg-muted"
                    fallback={<div className="h-10 w-10 rounded-full bg-muted" />} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{u.displayName || u.profileUrl}</p>
                    <p className="truncate text-xs text-muted-foreground">@{u.profileUrl}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Verify in browser**

Load `http://localhost:3000/` logged in. Expected: sunset hero, 3 community cards with banners, 3 user cards. Toggle dark mode (via account or system) — confirm contrast. Check console = no errors. Shrink window — cards reflow to 1 column.

- [ ] **Step 3: Commit**

```bash
git -C G:/git/headpat/headpat-place-web add src/routes/_app/index.tsx
git -C G:/git/headpat/headpat-place-web commit -m "feat: discover-hub home page"
```

---

### Task 2: Profile page

**Files:**
- Modify: `src/routes/_app/user/$profileUrl/index.tsx`

- [ ] **Step 1: Restyle the profile header**

Replace the header region (the banner div + Card header). The page already fetches `profile.byUrl` and has `useStorageUrl("banner", p.bannerFileId)`/`("avatar", p.avatarFileId)`. Swap the banner block to use `GradientBanner` (so a missing banner shows sunset, not nothing), make the avatar 80px (`h-20 w-20`) overlap the banner by `-mt-10`, name `text-2xl font-extrabold`, the Follow button `bg-primary text-primary-foreground`. Social handles become pill tags using `bg-brand-soft`-style: `className="rounded-full bg-primary/15 text-primary"`.

Concrete header block:

```tsx
import { GradientBanner } from "@/components/GradientBanner"
// ...
return (
  <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
    <div className="overflow-hidden rounded-2xl border">
      <GradientBanner kind="banner" fileId={p.bannerFileId} className="h-48 w-full" />
      <div className="px-6 pb-6">
        <div className="-mt-10 flex items-end gap-4">
          <Avatar className="h-20 w-20 ring-4 ring-background">
            <AvatarImage src={avatarUrl.data?.url} alt={p.displayName ?? p.userId} />
            <AvatarFallback>{(p.displayName ?? "?").charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 pb-1">
            <h1 className="text-2xl font-extrabold tracking-tight">{p.displayName || p.profileUrl}</h1>
            {p.status ? <p className="text-muted-foreground">{p.status}</p> : null}
          </div>
          <FollowButton targetUserId={p.userId} />
        </div>
        {/* bio, pronouns/location pills, follower/following links, socials — keep existing content,
            restyle social badges to: className="rounded-full bg-primary/15 text-primary border-transparent" */}
      </div>
    </div>
  </main>
)
```

Keep the existing `FollowButton` component but give the follow action `className="bg-primary text-primary-foreground hover:bg-primary/90"` when not following.

- [ ] **Step 2: Verify**

Load `http://localhost:3000/user/<a real profileUrl from /users>`. Confirm banner (sunset fallback if none), overlapping avatar, brand follow button, pill socials. Dark mode + narrow width check. No console errors.

- [ ] **Step 3: Commit**

```bash
git -C G:/git/headpat/headpat-place-web add src/routes/_app/user/$profileUrl/index.tsx
git -C G:/git/headpat/headpat-place-web commit -m "feat: social-style profile header"
```

---

### Task 3: Community detail

**Files:**
- Modify: `src/routes/_app/community/$communityId/index.tsx`

- [ ] **Step 1: Apply the same banner/avatar overlap pattern**

The page already has `useStorageUrl("community-banner", ...)`. Replace its banner block with `GradientBanner kind="community-banner"`, add an overlapping 80px community avatar (`StorageImage kind="community-avatar"`), name `text-2xl font-extrabold`, brand-green Follow CTA, and a stat strip below: `<b>{c.followersCount}</b> followers · View events`. Keep the existing follow/unfollow mutation and admin button.

- [ ] **Step 2: Verify**

Load a community detail page (`/community/headpat-official` after a data migration, or any seeded community). Confirm banner + avatar overlap + brand follow + stat strip. Dark mode + narrow check.

- [ ] **Step 3: Commit**

```bash
git -C G:/git/headpat/headpat-place-web add "src/routes/_app/community/$communityId/index.tsx"
git -C G:/git/headpat/headpat-place-web commit -m "feat: social-style community detail header"
```

---

### Task 4: Auth shell

**Files:**
- Modify: `src/routes/_auth.tsx` (layout)
- Modify: `src/routes/_auth/login.tsx` (OAuth grid + primary button)

- [ ] **Step 1: Restyle the centered auth layout**

In `src/routes/_auth.tsx`, give the page a subtle sunset presence — e.g. a sunset radial/blob behind the centered card. Keep it readable, not loud:

```tsx
// wrap the existing <Outlet/> container
<div className="relative min-h-screen flex items-center justify-center px-4">
  <div aria-hidden className="bg-sunset pointer-events-none absolute inset-0 opacity-15 blur-3xl" />
  <div className="relative z-10 w-full max-w-md">
    <Outlet />
  </div>
</div>
```

- [ ] **Step 2: Polish the login OAuth grid + primary button**

In `src/routes/_auth/login.tsx`, arrange the 8 OAuth buttons in a 2-column grid (`grid grid-cols-2 gap-2`), give the main Login/Register submit `className="w-full bg-primary text-primary-foreground hover:bg-primary/90"`. Keep all existing auth logic (signIn.social / signIn.oauth2 / MFA redirect) untouched.

- [ ] **Step 3: Verify**

Load `http://localhost:3000/login` (log out first via the sidebar user menu, or open an incognito window). Confirm sunset backdrop, 2-col OAuth grid, brand primary button. Toggle the register link. Dark mode + narrow check. No console errors. **Do not** complete an OAuth flow (providers aren't configured locally).

- [ ] **Step 4: Commit**

```bash
git -C G:/git/headpat/headpat-place-web add src/routes/_auth.tsx src/routes/_auth/login.tsx
git -C G:/git/headpat/headpat-place-web commit -m "feat: polished auth shell + OAuth grid"
```

---

### Task 5: Community list + Users discover cards

**Files:**
- Modify: `src/routes/_app/community/index.tsx`
- Modify: `src/routes/_app/users.tsx`

- [ ] **Step 1: Upgrade community cards**

In `src/routes/_app/community/index.tsx`, swap the inline `StorageImage` community-banner for `GradientBanner` (sunset fallback), add `card-hover` to each Card, bold the name, keep follower count + tag pills. Tag pills: `className="rounded-full bg-primary/15 text-primary"`.

- [ ] **Step 2: Upgrade user discovery cards**

In `src/routes/_app/users.tsx`, add `card-hover` to each Card, make the avatar 48px, bold the display name, keep the bio clamp + follower count. No banner here (just avatar+name+bio).

- [ ] **Step 3: Verify**

Load `/community` and `/users`. Confirm hover lift, sunset-fallback banners on community cards, brand pill tags. Dark mode + narrow reflow. No console errors.

- [ ] **Step 4: Commit**

```bash
git -C G:/git/headpat/headpat-place-web add src/routes/_app/community/index.tsx src/routes/_app/users.tsx
git -C G:/git/headpat/headpat-place-web commit -m "feat: banner-led community + user discovery cards"
```

---

### Task 6: Gallery grid

**Files:**
- Modify: `src/routes/_app/gallery/index.tsx`

- [ ] **Step 1: Make it image-first with hover zoom + title overlay**

Each tile: a `zoom-parent rounded-xl` container holding `StorageImage` with `className="zoom-img h-56 w-full object-cover"`, a bottom gradient scrim with the title in white, and an NSFW badge top-right when `g.nsfw`. Remove the separate CardHeader/Footer text — the image is the hero.

```tsx
<Link key={g.id} to={`/gallery/${g.id}` as never} className="zoom-parent block rounded-xl">
  <div className="relative">
    <StorageImage kind="gallery" fileId={g.fileId} alt={g.name}
      className="zoom-img h-56 w-full object-cover bg-muted"
      fallback={<div className="h-56 w-full bg-muted" />} />
    {g.nsfw ? <span className="absolute right-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-xs text-white">NSFW</span> : null}
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
      <p className="truncate font-semibold text-white">{g.name}</p>
    </div>
  </div>
</Link>
```

Wrap the grid in `grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.

- [ ] **Step 2: Verify**

Load `/gallery` (upload a test image first if empty — `/gallery/upload`). Confirm tiles show image with title scrim, hover zoom works, NSFW badge appears on flagged items. Dark mode + narrow check.

- [ ] **Step 3: Commit**

```bash
git -C G:/git/headpat/headpat-place-web add src/routes/_app/gallery/index.tsx
git -C G:/git/headpat/headpat-place-web commit -m "feat: image-first gallery grid with hover zoom"
```

---

### Task 7: Notifications — activity feed

**Files:**
- Modify: `src/routes/_app/notifications.tsx`

- [ ] **Step 1: Render notifications as an activity feed**

Read the current file first (it queries notifications + has mark-all-read). Each row: a `flex gap-3` with an avatar circle (use `StorageImage kind="avatar"` if the notification carries an `actorUserId`, else a brand-tinted dot), bold actor/title, the message, and a relative timestamp (`new Date(n.createdAt).toLocaleString()`). Unread rows get `bg-primary/5`. Keep the "mark all read" button.

- [ ] **Step 2: Verify**

Load `/notifications`. With no data it shows an empty state; that's fine. Confirm layout renders, mark-all-read button present, no console errors. Dark mode check.

- [ ] **Step 3: Commit**

```bash
git -C G:/git/headpat/headpat-place-web add src/routes/_app/notifications.tsx
git -C G:/git/headpat/headpat-place-web commit -m "feat: activity-feed notifications"
```

---

### Task 8: Account stat row

**Files:**
- Modify: `src/routes/_app/account/index.tsx`

- [ ] **Step 1: Add a 3-card stat row at the top of the General tab**

At the start of `<TabsContent value="general">`, insert a stat row using `profileQuery.data` for followers/communities and the notifications query for unread. Add a query for communities count via `orpc.community.myCommunities` if it exists, else omit the communities stat and show only Followers + Unread (check the router first; do not invent a procedure). Unread = count of notifications where `read === false`, derived client-side from `orpc.notification.list`.

```tsx
<div className="mx-auto grid max-w-4xl grid-cols-3 gap-3 px-4 pt-6">
  <StatCard label="Followers" value={profileQuery.data?.followersCount ?? 0} accent="brand" />
  <StatCard label="Following" value={profileQuery.data?.followingCount ?? 0} />
  <StatCard label="Unread" value={unreadCount} accent="warm" />
</div>
```

Define a small `StatCard` helper at the bottom of the file:

```tsx
function StatCard({ label, value, accent }: { label: string; value: number; accent?: "brand" | "warm" }) {
  const color = accent === "brand" ? "text-primary" : accent === "warm" ? "text-[#fb7185]" : ""
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}
```

Use `profileQuery.data?.followingCount` for the middle stat (it exists on the profile row). For unread, add near the top of `AccountPage`:

```tsx
const notifications = useQuery({ ...orpc.notification.list.queryOptions({ input: {} }), enabled: !!session?.user })
const unreadCount = (notifications.data ?? []).filter((n: { read: boolean }) => !n.read).length
```

(Verify `orpc.notification.list` input shape against `src/routes/index.ts` / the notification router before wiring; adjust input if it requires args.)

- [ ] **Step 2: Verify**

Load `/account`. Confirm the 3 stat cards render above the existing forms; Followers in brand green, Unread in warm pink. The rest of the General tab (email/password/profileUrl/privacy/2FA/delete) still works. Dark mode check.

- [ ] **Step 3: Commit**

```bash
git -C G:/git/headpat/headpat-place-web add src/routes/_app/account/index.tsx
git -C G:/git/headpat/headpat-place-web commit -m "feat: account stat row"
```

---

### Task 9: Gallery upload form

**Files:**
- Modify: `src/routes/_app/gallery/upload.tsx`

- [ ] **Step 1: Add a drop-zone styled file input + preview thumbnail**

Replace the bare `<input type="file">` with a styled clickable drop area (dashed border, brand hover). When a file is chosen, show a preview thumbnail via `URL.createObjectURL(file)` (revoke it on change/unmount). Brand-green submit button. Keep the existing presigned-PUT upload logic intact.

```tsx
const [previewUrl, setPreviewUrl] = useState<string | null>(null)
// on file pick: setPreviewUrl(URL.createObjectURL(f)); revoke previous in a useEffect cleanup

<button type="button" onClick={() => fileInputRef.current?.click()}
  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input p-8 hover:border-primary hover:bg-primary/5">
  {previewUrl
    ? <img src={previewUrl} alt="preview" className="max-h-48 rounded-lg object-contain" />
    : <span className="text-muted-foreground text-sm">Click to choose an image</span>}
</button>
<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={...} />
```

Submit button: `className="w-full bg-primary text-primary-foreground hover:bg-primary/90"`.

- [ ] **Step 2: Verify**

Load `/gallery/upload`. Pick an image — preview appears. Fill title, upload — confirm it still hits S3 and redirects to the detail page (full flow already known-good). Dark mode check.

- [ ] **Step 3: Commit**

```bash
git -C G:/git/headpat/headpat-place-web add src/routes/_app/gallery/upload.tsx
git -C G:/git/headpat/headpat-place-web commit -m "feat: drop-zone gallery upload with preview"
```

---

### Task 10: Event detail

**Files:**
- Modify: `src/routes/_app/events/$eventId.tsx`

- [ ] **Step 1: Add a hero header + brand attend CTA + capacity meter**

Read the file first. Add a `bg-sunset` hero strip with the event title (white, extrabold), date + location below. Move the attend/unattend toggle into a brand-green primary button. If the event has a `visitorCapacity`, render a thin capacity meter: a track `bg-muted rounded-full h-2` with a `bg-primary` fill at `width: (attendeesCount / visitorCapacity * 100)%` (clamp 0–100), plus `attendeesCount / visitorCapacity` text. If capacity is null, just show the attendee count.

- [ ] **Step 2: Verify**

Load an event detail page (`/events/<id>` — seed via migration or the events list). Confirm sunset hero, brand attend button, capacity meter when capacity set. Dark mode + narrow check.

- [ ] **Step 3: Commit**

```bash
git -C G:/git/headpat/headpat-place-web add "src/routes/_app/events/$eventId.tsx"
git -C G:/git/headpat/headpat-place-web commit -m "feat: event detail hero + capacity meter"
```

---

### Task 11: Message thread

**Files:**
- Modify: `src/routes/_app/messages/$conversationId.tsx`

- [ ] **Step 1: Refine bubbles**

The thread already renders bubbles with mine/theirs. Change own-message bubbles to `bg-primary text-primary-foreground` (brand green), keep theirs `bg-muted`. Add a small sender avatar (`StorageImage kind="avatar"`, 24px) to the left of incoming messages only. Keep the 3s poll, composer, and send logic.

- [ ] **Step 2: Verify**

Open a conversation (`/messages/<id>`). Confirm own messages are brand-green, incoming have an avatar. Send a message — appears, brand-green. Dark mode check.

- [ ] **Step 3: Commit**

```bash
git -C G:/git/headpat/headpat-place-web add "src/routes/_app/messages/$conversationId.tsx"
git -C G:/git/headpat/headpat-place-web commit -m "feat: brand-styled message bubbles with sender avatars"
```

---

### Task 12: Sidebar light touch

**Files:**
- Modify: `src/components/sidebar/nav-list.tsx`
- Modify: `src/styles/globals.css` (sidebar active vars, if needed)

- [ ] **Step 1: Brand-green active nav item**

In `nav-list.tsx`, mark the active route. TanStack Router's `Link` exposes active state via `activeProps` or the `data-status="active"` attribute. Add `activeProps={{ className: "bg-primary/10 text-primary font-medium" }}` to each `<Link>` (or style `data-status=active`). Keep all existing nav structure/behavior.

- [ ] **Step 2: Verify**

Navigate between sidebar routes. Confirm the current page's nav item is tinted brand green. Confirm nothing else about the sidebar changed (links still work, mobile toggle still works). Dark mode check.

- [ ] **Step 3: Commit**

```bash
git -C G:/git/headpat/headpat-place-web add src/components/sidebar/nav-list.tsx src/styles/globals.css
git -C G:/git/headpat/headpat-place-web commit -m "feat: brand-green active sidebar item"
```

---

### Task 13: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Walk every touched route in the browser**

With both servers up and logged in, load each in turn and confirm 200 + no console errors, in BOTH light and dark mode:
`/`, `/login`, `/user/<url>`, `/community`, `/community/<id>`, `/users`, `/gallery`, `/gallery/upload`, `/notifications`, `/account`, `/events/<id>`, `/messages/<id>`, `/legal/eula`, `/support`, `/pawcraft`.

- [ ] **Step 2: Confirm backend tests still green**

Run: `cd G:/git/headpat/headpat-place-api && bun test`
Expected: `186 pass, 0 fail` (unchanged — web-only work).

- [ ] **Step 3: Final commit if any stragglers**

```bash
git -C G:/git/headpat/headpat-place-web status
# commit anything outstanding with an appropriate message
```

---

## Self-review notes

- **Spec coverage:** Tokens (Task 0), all 13 page groups (Tasks 1–12), verification (Task 13). Sidebar light-touch = Task 12. Legal/support/pawcraft inherit tokens automatically (no task needed beyond Task 13 verification) since they use standard `text-foreground`/headings.
- **Derived data:** "Unread" stat (Task 8) is computed client-side from `notification.list`; "communities count" omitted unless a real procedure exists — verify before wiring, do not invent procedures.
- **Brand color:** reuse existing `--primary` (= #008055); only sunset tokens are new.
- **No backend changes** in any task.
