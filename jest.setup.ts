// Jest setup file.
//
// @testing-library/react-native v13+ registers its custom matchers
// (toBeVisible, toHaveTextContent, etc.) automatically on any import,
// so no explicit extend-expect call is needed here.

// @supabase/realtime-js picks a WebSocket implementation when the client is
// constructed and throws outright on Node < 22, which would fail any suite that
// imports `lib/supabase` for real. Nothing in the app subscribes to realtime, so
// an inert stub is enough to get the client built.
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class {
    close() {}
    send() {}
    addEventListener() {}
    removeEventListener() {}
  } as unknown as typeof WebSocket;
}

// AsyncStorage is a native module; use the mock the package ships.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Opening a real auth session is impossible in a test environment.
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
  WebBrowserPresentationStyle: { AUTOMATIC: 'AUTOMATIC' },
  openBrowserAsync: jest.fn(),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
  setOptions: jest.fn(),
}));

// Keeps the OAuth redirect deterministic across Expo Go / dev-build resolution.
// getInitialURL/addEventListener back the invite deep-link capture.
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `ghumi://${path.replace(/^\//, '')}`),
  parse: jest.fn(),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// The photo library and the clipboard are native; neither exists under Jest.
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: null })),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
}));
