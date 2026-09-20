import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const appDir = join(__dirname, '..', '..', 'app');

/**
 * Guards the route structure.
 *
 * Expo Router navigates to "/" on launch. If no route resolves there, the root
 * layout never mounts — the app hangs on the splash screen with no error logged,
 * which is very hard to diagnose. The My Plan screen must therefore stay the
 * index route of the (tabs) group. Renaming it breaks the app — and note that
 * groups.tsx is now a separate tab, so it cannot stand in for the index.
 */
describe('route structure', () => {
  it('has an index route in the tabs group so "/" resolves', () => {
    expect(existsSync(join(appDir, '(tabs)', 'index.tsx'))).toBe(true);
  });

  it('anchors the root layout at the tabs group', () => {
    const layout = readFileSync(join(appDir, '_layout.tsx'), 'utf8');
    expect(layout).toMatch(/unstable_settings/);
    expect(layout).toMatch(/anchor:\s*'\(tabs\)'/);
  });

  it('exposes exactly the four expected tabs', () => {
    const screens = readdirSync(join(appDir, '(tabs)'))
      .filter((f) => f.endsWith('.tsx') && f !== '_layout.tsx')
      .sort();
    expect(screens).toEqual(['friends.tsx', 'groups.tsx', 'index.tsx', 'profile.tsx']);
  });

  it('keeps the signed-out group separate from the tabs', () => {
    expect(existsSync(join(appDir, '(auth)', 'sign-in.tsx'))).toBe(true);
    expect(existsSync(join(appDir, '(auth)', '_layout.tsx'))).toBe(true);
  });

  it('puts group and join routes outside the tabs so they open full-screen', () => {
    expect(existsSync(join(appDir, 'group', '[id].tsx'))).toBe(true);
    expect(existsSync(join(appDir, 'group', 'create.tsx'))).toBe(true);
    expect(existsSync(join(appDir, 'group', '_layout.tsx'))).toBe(true);
    expect(existsSync(join(appDir, 'join', '[code].tsx'))).toBe(true);
    expect(existsSync(join(appDir, 'join', '_layout.tsx'))).toBe(true);
  });

  it('guards the group and join routes behind a session', () => {
    const layout = readFileSync(join(appDir, '_layout.tsx'), 'utf8');
    const protectedBlock = /guard=\{session !== null\}>([\s\S]*?)<\/Stack.Protected>/.exec(layout);

    expect(protectedBlock).not.toBeNull();
    // An invite deep link must not be able to reach group data unauthenticated.
    expect(protectedBlock?.[1]).toMatch(/name="group"/);
    expect(protectedBlock?.[1]).toMatch(/name="join"/);
  });
});
