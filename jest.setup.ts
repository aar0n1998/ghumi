// Jest setup file.
//
// @testing-library/react-native v13+ registers its custom matchers
// (toBeVisible, toHaveTextContent, etc.) automatically on any import,
// so no explicit extend-expect call is needed here.

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
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `ghumi://${path.replace(/^\//, '')}`),
  parse: jest.fn(),
}));
