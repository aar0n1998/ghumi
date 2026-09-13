# Ghumi — React Native (Expo) Codebase

## Stack

- **Expo** (SDK 57) with **Expo Router** v57 — file-based routing
- **React Native** 0.86 · **React** 19.2 · **TypeScript** 6 (strict)
- **react-native-reanimated** for animations
- **Jest** + **@testing-library/react-native** for tests
- **Supabase** for auth and (next) data

---

## Current State

What exists, so you know what you are building on top of:

| Area | Status |
|---|---|
| Google sign-in, session persistence, sign-out | **Working** — full Google round-trip verified end to end on the iOS simulator |
| Splash → auth-guarded routing | **Working** — verified on the iOS simulator |
| Horizon theme, brand mark, app icons | **Working** |
| Groups tab | **Built** — list, create (title/description/cover), group detail, invite links, join flow |
| Explore tab | **Placeholder only** |
| Profile tab | Shows Google name/avatar/email + sign out. No editing. |
| Database | **Schema written, not yet applied.** `supabase/migrations/` holds it; the live project still has auth only until someone runs it. |
| Group sub-features (chat, itinerary, places, expenses, documents, packing) | **Placeholder tiles only** — each opens an alert saying it is not built |

**Next piece of work is the first group sub-feature.** The six tiles are declared in
`lib/group-features.ts`; pick one and give it a real route.

---

## Directory Structure

```
app/              Screens and navigation layouts only. No logic here beyond what Expo Router needs.
  _layout.tsx     Root layout — providers, auth route guards, splash handoff
  (auth)/         Signed-out group. Sign-in lives here.
  (tabs)/         Signed-in group. Each file = one tab screen.
components/       Shared UI components used across screens.
  ui/             Low-level primitives (icons). Platform-split files live here.
hooks/            Custom React hooks. Business logic and state belong here, not in screens.
lib/              Third-party client singletons and non-React utilities. No React code, no JSX.
constants/        Static values — Colors, Spacing, Radii, Fonts. No logic.
assets/           Images, fonts. No code.
  brand/          Source SVGs the app icons are rasterised from.
__tests__/        Mirrors the source tree: __tests__/app/, __tests__/components/, __tests__/hooks/.
```

Keep this structure flat. Do not add new top-level directories without a clear reason.

---

## Routing (Expo Router)

- Every file in `app/` is a route. The filename is the URL segment.
- Group folders with `(parens)` to share a layout without affecting the URL — e.g. `(tabs)`.
- Every folder that needs a shared layout gets a `_layout.tsx`.
- Modals go in `app/` as a sibling to the group they belong to, presented via
  `<Stack.Screen options={{ presentation: 'modal' }} />`.
- Navigate with `<Link href="/route">` or `router.push('/route')` from `expo-router`.

### There must always be a route for `/`

`app/(tabs)/index.tsx` is the Groups screen, and `app/_layout.tsx` sets
`unstable_settings = { anchor: '(tabs)' }`. **Do not rename that file.**

Expo Router navigates to `/` on launch. If nothing resolves there, the root layout never mounts —
and it fails *silently*: no error, no red screen, no log. The app just sits on the splash forever,
because `isLoading` never clears and `SplashScreen.hideAsync()` never runs. This has already cost
one debugging session.

`__tests__/app/routes.test.ts` guards this. If it fails, fix the routes — do not weaken the test.

Symptom to recognise: modules evaluate (top-level `console.log` fires) but component renders never
happen. That gap means route resolution, not a rendering bug.

### react-navigation types under SDK 57

expo-router now **vendors its own copy** of react-navigation. The vendored types are structurally
identical to the originals but nominally distinct, so mixing the two fails to typecheck — a
component typed with `@react-navigation/bottom-tabs`' `BottomTabBarButtonProps` is rejected by
`tabBarButton`. Import both the types and the components from expo-router instead:

```ts
import { PlatformPressable } from 'expo-router/react-navigation';
import type { BottomTabBarButtonProps } from 'expo-router/tabs';
```

See `components/haptic-tab.tsx`.

### Auth routing

`app/_layout.tsx` picks the route group declaratively with `<Stack.Protected guard={...}>` —
`(tabs)` when there is a session, `(auth)` when there is not. Do **not** add imperative
`router.replace` redirects in a `useEffect`; that reintroduces the wrong-screen flash this avoids.

The native splash is held until `useAuth().isLoading` resolves, so a restored session lands
straight on Groups.

---

## Components

- One component per file. Filename matches the export name in kebab-case: `themed-text.tsx` exports `ThemedText`.
- Props interface defined in the same file, named `<Component>Props`.
- Always use `StyleSheet.create` — no inline style objects.
- Platform-specific implementations use file extensions: `icon-symbol.ios.tsx` / `icon-symbol.tsx`. No `Platform.OS` conditionals for entirely different implementations.
- `components/ui/` is for primitives that wrap a single RN element. Composite components go in `components/`.

```tsx
// Good
export type ButtonProps = PressableProps & { label: string };

export function Button({ label, ...rest }: ButtonProps) {
  return <Pressable style={styles.root} {...rest}><Text>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  root: { padding: 12, borderRadius: 8 },
});
```

---

## Hooks

- All files prefixed `use-` in kebab-case: `use-auth.tsx`, `use-feed.ts`.
- Use `.tsx` when the hook file also exports a provider component (as `use-auth.tsx` does);
  plain `.ts` otherwise.
- Hooks own state and side effects. Screens consume hooks; screens do not fetch data directly.
- Platform-split hooks use extensions: `use-color-scheme.ts` / `use-color-scheme.web.ts`.

---

## Auth

- **Supabase** provides auth today and will provide Groups data (Postgres + RLS) next.
- `lib/supabase.ts` owns the client singleton. **Only `hooks/use-auth.tsx` may touch
  `supabase.auth`** — screens consume `useAuth()` and never import the client directly.
- Sign-in is browser-based Google OAuth (`expo-web-browser` + a `Linking.createURL` redirect), so it
  works in Expo Go with no native modules and unchanged in a dev build.
- Credentials come from `.env` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`); see
  `.env.example`. `.env` is gitignored. Never put the `service_role` key in an `EXPO_PUBLIC_` var.
- `npm install` resolves from the public registry via the committed `.npmrc`, so a private registry
  configured globally in `~/.npmrc` is not inherited here.

### Deliberate tradeoffs — do not "fix" these without discussion

These were chosen knowingly. Each has a reason and a revisit trigger.

| Choice | Why | Revisit when |
|---|---|---|
| Sessions in AsyncStorage, not `expo-secure-store` | SecureStore caps values at 2048 bytes; Supabase sessions can exceed it | Before production — needs a chunking adapter |
| Implicit OAuth flow, not PKCE | PKCE needs a `crypto.getRandomValues` polyfill under Hermes | Before production |
| Google SSO only | Fastest path to a working account system | **Apple requires Sign in with Apple for App Store review once Google SSO ships** — needed before submission, not before building |
| Browser-based OAuth, not the native Google sheet | Works in Expo Go with zero native config; unchanged in a dev build | Only if the native account-picker UX becomes a priority (costs a dev build) |

---

## Data layer (Supabase)

**There are no tables yet.** The Supabase project currently has auth only. Groups is the first
feature that needs a schema.

Layering mirrors auth — keep it:

```
lib/supabase.ts        the client singleton (already exists)
hooks/use-groups.ts    owns all group queries, mutations, loading and error state
app/(tabs)/index.tsx   consumes useGroups(). Never imports `supabase` directly.
```

Rules:

- **Screens never import `lib/supabase` directly.** If a screen needs data, that is a missing hook.
- **Every table gets Row Level Security enabled** with policies keyed on `auth.uid()`. A table
  without RLS is readable by anyone holding the anon key, which ships in the app bundle.
- Write schema changes as SQL migration files so they are reviewable and replayable — do not make
  schema changes only through the dashboard UI, or the repo stops describing the real system.
- Generate TypeScript types from the schema rather than hand-writing row interfaces.
- The anon/publishable key is safe in the bundle **because** RLS gates it. That is the whole
  security model — treat a missing policy as a data leak, not a TODO.

### Groups — decisions already made

These were settled on 2026-09-13. Do not relitigate them without a reason.

| Question | Decision |
|---|---|
| Group vs. trip | **A group *is* a trip.** No separate `trips` table. A second trip means a second group. |
| Membership | **Instant join by invite code.** Holding the link is the authorisation; no approval step. |
| Link revocation | Owner can rotate the code (`regenerate_invite_code`), which kills the old link. No expiry. |
| Link format | `ghumi://join/CODE` custom scheme. Only opens for someone who already has the app. |
| Cover images | Uploaded from the device to the public `group-covers` bucket. |
| Realtime | **Not in v1.** Lists refetch on screen focus and on pull-to-refresh. |

Still open: whether an https universal link is worth the hosting (see `lib/invite-link.ts`), and
whether owners should be able to remove members (the RLS policy already allows it; there is no UI).

### Applying the schema

There are two migrations in `supabase/migrations/`. They are idempotent — safe to re-run.

```bash
supabase db push          # if the CLI is installed and the project is linked
```

Otherwise paste each file into the SQL editor in the Supabase dashboard, in order. **Groups will
show a load error until this is done** — the tables do not exist in the live project yet.

Both were validated against a throwaway Postgres 16 with stubbed `auth`/`storage` schemas, including
a 22-check pass over the RLS policies (isolation between users, the join RPC, code rotation,
cascade on user deletion).

### Things about the Groups schema that will bite you

- **Membership predicates must stay `security definer`.** A policy on `group_members` that queries
  `group_members` re-enters itself and Postgres raises *"infinite recursion detected in policy"*.
  `is_group_member()` and `is_group_owner()` read the table with RLS bypassed to break that cycle.
- **There is no INSERT policy on `group_members`, and no INSERT grant.** Membership is only ever
  created by the `on_group_created` trigger or by `join_group()`. A client cannot add itself, or
  anyone else, to a group directly. Do not "fix" this by adding a policy.
- **`group_members.user_id` references `public.profiles`, not `auth.users`.** PostgREST needs that
  foreign key to embed a member's name and avatar in the same request. The cascade to `auth.users`
  still happens, through `profiles.id`.
- **Non-members have no `select` on `groups` at all.** The pre-join preview goes through
  `get_group_preview()`, which returns a fixed safe subset. A permissive policy keyed on the invite
  code would expose every column of every group to anyone who could guess a code.
- **Cover uploads are keyed by uploader id, not group id** (`<uid>/<random>.jpg`), because the group
  row does not exist yet when the create screen uploads the image.
- **Never create a row with `.insert().select()` when the table's SELECT policy depends on a
  row written by a trigger.** That compiles to `INSERT ... RETURNING`, and Postgres will only
  return a row that already satisfies the SELECT policy. `groups` is readable via
  `is_group_member(id)`, and membership is added by an AFTER INSERT trigger that has not fired
  yet — so every create failed with *"new row violates row-level security policy"*. Groups are
  created through the security-definer `create_group()` RPC instead (migration 0003); direct
  INSERT on `groups` is revoked. A plain INSERT without RETURNING always worked, which is exactly
  why the first RLS test suite passed while the app was broken — **test the statement the client
  actually sends.**
- **Upload base64, not a blob.** `fetch(fileUri).then(r => r.blob())` silently uploads a zero-byte
  object under Hermes. `use-create-group.ts` decodes base64 to an ArrayBuffer instead.

---

## Local development

```bash
npm start          # Metro. Then press i for iOS, or scan the QR in Expo Go
npm test           # Jest
npm run typecheck  # tsc --noEmit
npm run lint       # expo lint
```

**Node version:** this machine resolves `node` to v14 from `/usr/local/bin/node` in
non-interactive shells, which Expo will not run on. React Native 0.86 requires
**Node ^20.19.4 || ^22.13.0 || ^24.3.0 || >=25** — nvm's default of 20.17 is *not* enough.
Put a supported version first on `PATH` before running anything:

```bash
export PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH"
```

**`react-test-renderer` must be pinned to exactly the same version as `react`.** A caret range
floats it ahead of whatever React the SDK pins and a clean `npm install` then fails to resolve.

**Expo Go only ever bundles the latest SDK.** If the app will not open on a phone and Expo Go
reports an SDK mismatch, the project is behind — upgrade, or use a dev build.

**Simulator:** the Claude Code iOS Simulator integration requires
`sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`. Until that is run, an agent can
boot a simulator and take screenshots with `xcrun simctl` but **cannot tap** — a human has to drive
any flow that needs interaction (including the Google sign-in round trip).

**Verifying Supabase config without the app:**

```bash
curl -s -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  "$EXPO_PUBLIC_SUPABASE_URL/auth/v1/settings"
```

`"google": true` in the response confirms the provider is enabled.

---

## Theming

The theme is **"Horizon"** — warm sand grounds, deep teal primary, terracotta accent.

- Colors live in `constants/theme.ts` as `Colors.light` and `Colors.dark`. Both schemes expose the
  same token names (`background`, `surface`, `text`, `muted`, `border`, `tint`, `accent`, `danger`,
  `onTint`, plus the `tabIcon*` keys).
- `Spacing` (4pt scale) and `Radii` also live there. Use them instead of loose numbers.
- Fonts live in `constants/theme.ts` as `Fonts` (platform-selected).
- Use `useThemeColor` to read a color token. Use `useColorScheme` to read the current mode.
- Never hardcode a hex value in a component — reference a token from `Colors`. The only place raw
  hex is allowed is `constants/theme.ts` itself and `app.json` (which cannot read TS).

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Component file | kebab-case | `themed-text.tsx` |
| Component export | PascalCase | `ThemedText` |
| Hook file | `use-` + kebab-case | `use-color-scheme.ts` |
| Hook export | `use` + PascalCase | `useColorScheme` |
| Screen file | kebab-case | `profile.tsx` |
| Constant file | kebab-case | `theme.ts` |
| Test file | same name + `.test` | `themed-text.test.tsx` |

---

## Tests

- Tests live in `__tests__/` mirroring the source tree.
- Every component and hook gets a test file.
- Use `render` + `screen` from `@testing-library/react-native`. Avoid `getByTestId` — prefer role or text queries.
- Run: `npm test` (single run) or `npm run test:watch` (watch mode).
- Also run `npm run typecheck` and `npm run lint` before considering a change done.
- Native modules are mocked centrally in `jest.setup.ts` (AsyncStorage, web browser, splash,
  linking). Add new native mocks there, not per-file.

```tsx
// Prefer
screen.getByRole('button', { name: 'Submit' })
screen.getByText('Welcome')

// Avoid
screen.getByTestId('submit-btn')
```

---

## TypeScript

- Strict mode is on. No `any`.
- Use `@/` alias for all imports: `@/components/themed-text`, `@/hooks/use-color-scheme`.
- Prefer explicit return types on hooks. Component return types are inferred.
