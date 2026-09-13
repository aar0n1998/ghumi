# Ghumi — React Native (Expo) Codebase

## Stack

- **Expo** (SDK 54) with **Expo Router** v6 — file-based routing
- **React Native** 0.81 · **React** 19 · **TypeScript** (strict)
- **react-native-reanimated** for animations
- **Jest** + **@testing-library/react-native** for tests
- **Supabase** for auth and (next) data

---

## Current State

What exists, so you know what you are building on top of:

| Area | Status |
|---|---|
| Google sign-in, session persistence, sign-out | **Implemented; live round-trip not yet confirmed by a human.** Supabase/GCP config verified by API, unit tests pass, but nobody has completed an actual Google sign-in in the app. Verify this first. |
| Splash → auth-guarded routing | **Working** — verified on the iOS simulator |
| Horizon theme, brand mark, app icons | **Working** |
| Groups tab | **Placeholder only** — renders an empty state, no data |
| Explore tab | **Placeholder only** |
| Profile tab | Shows Google name/avatar/email + sign out. No editing. |
| Database | **No tables exist yet.** Supabase project has auth only. |

**Next piece of work is Groups.** Nothing about it has been built or schema'd yet.

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

Open questions for Groups, not yet decided — ask rather than assume: group membership model
(invite codes vs. direct invites vs. links), whether groups own trips or are the same object,
and whether realtime sync is needed for v1.

---

## Local development

```bash
npm start          # Metro. Then press i for iOS, or scan the QR in Expo Go
npm test           # Jest
npm run typecheck  # tsc --noEmit
npm run lint       # expo lint
```

**Node version:** this machine resolves `node` to v14 from `/usr/local/bin/node` in
non-interactive shells, which Expo SDK 54 will not run on. Ensure Node 20+ is first on `PATH`
before running anything (nvm's default is 20.17).

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
