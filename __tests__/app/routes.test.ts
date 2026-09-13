import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

const appDir = join(__dirname, '..', '..', 'app');

/**
 * Guards the route structure.
 *
 * Expo Router navigates to "/" on launch. If no route resolves there, the root
 * layout never mounts — the app hangs on the splash screen with no error logged,
 * which is very hard to diagnose. The Groups screen must therefore stay the
 * index route of the (tabs) group. Renaming it to groups.tsx breaks the app.
 */
describe('route structure', () => {
  it('has an index route in the tabs group so "/" resolves', () => {
    expect(existsSync(join(appDir, '(tabs)', 'index.tsx'))).toBe(true);
  });

  it('anchors the root layout at the tabs group', () => {
    const layout = require('fs').readFileSync(join(appDir, '_layout.tsx'), 'utf8');
    expect(layout).toMatch(/unstable_settings/);
    expect(layout).toMatch(/anchor:\s*'\(tabs\)'/);
  });

  it('exposes exactly the three expected tabs', () => {
    const screens = readdirSync(join(appDir, '(tabs)'))
      .filter((f) => f.endsWith('.tsx') && f !== '_layout.tsx')
      .sort();
    expect(screens).toEqual(['explore.tsx', 'index.tsx', 'profile.tsx']);
  });

  it('keeps the signed-out group separate from the tabs', () => {
    expect(existsSync(join(appDir, '(auth)', 'sign-in.tsx'))).toBe(true);
    expect(existsSync(join(appDir, '(auth)', '_layout.tsx'))).toBe(true);
  });
});
