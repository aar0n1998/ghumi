# Ghumi — React Native (Expo) Codebase

## Stack

- **Expo** (SDK 54) with **Expo Router** v6 — file-based routing
- **React Native** 0.81 · **React** 19 · **TypeScript** (strict)
- **react-native-reanimated** for animations
- **Jest** + **@testing-library/react-native** for tests

---

## Directory Structure

```
app/              Screens and navigation layouts only. No logic here beyond what Expo Router needs.
  _layout.tsx     Root layout — theme provider, stack config
  (tabs)/         Tab group. Each file = one tab screen.
components/       Shared UI components used across screens.
  ui/             Low-level primitives (icons, collapsibles). Platform-split files live here.
hooks/            Custom React hooks. Business logic and state belong here, not in screens.
constants/        Static values — Colors, Fonts, spacing. No logic.
assets/           Images, fonts. No code.
__tests__/        Mirrors the source tree: __tests__/components/, __tests__/hooks/, etc.
```

Keep this structure flat. Do not add new top-level directories without a clear reason.

---

## Routing (Expo Router)

- Every file in `app/` is a route. The filename is the URL segment.
- Group folders with `(parens)` to share a layout without affecting the URL — e.g. `(tabs)`.
- Every folder that needs a shared layout gets a `_layout.tsx`.
- Modals go in `app/` as a sibling to the group they belong to (e.g. `app/modal.tsx`).
- Navigate with `<Link href="/route">` or `router.push('/route')` from `expo-router`.

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

- All files prefixed `use-` in kebab-case: `use-auth.ts`, `use-feed.ts`.
- Hooks own state and side effects. Screens consume hooks; screens do not fetch data directly.
- Platform-split hooks use extensions: `use-color-scheme.ts` / `use-color-scheme.web.ts`.

---

## Theming

- Colors live in `constants/theme.ts` as `Colors.light` and `Colors.dark`.
- Fonts live in `constants/theme.ts` as `Fonts` (platform-selected).
- Use `useThemeColor` to read a color token. Use `useColorScheme` to read the current mode.
- Never hardcode a hex value in a component — reference a token from `Colors`.

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
