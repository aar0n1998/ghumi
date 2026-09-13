import { act, renderHook } from '@testing-library/react-native';

import { useGoBack } from '@/hooks/use-go-back';

const back = jest.fn();
const replace = jest.fn();
const canGoBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
    push: jest.fn(),
  }),
}));

// jest.mock factories are hoisted, so the bindings they close over must be
// `mock`-prefixed. These alias the plain names used in the assertions.
const mockBack = back;
const mockReplace = replace;
const mockCanGoBack = canGoBack;

beforeEach(() => {
  back.mockClear();
  replace.mockClear();
  canGoBack.mockReset();
});

describe('useGoBack', () => {
  /**
   * Regression guard. These screens used `router.replace('/')` for their back
   * button, which swaps the route and animates *forward* — the destination slid
   * in from the right and the stack never unwound.
   */
  it('pops the stack when there is history', () => {
    canGoBack.mockReturnValue(true);

    const { result } = renderHook(() => useGoBack('/'));
    act(() => result.current());

    expect(back).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });

  it('falls back to the given route when there is nothing to pop', () => {
    canGoBack.mockReturnValue(false);

    const { result } = renderHook(() => useGoBack('/'));
    act(() => result.current());

    expect(replace).toHaveBeenCalledWith('/');
    expect(back).not.toHaveBeenCalled();
  });

  it('defaults the fallback to the Groups list', () => {
    canGoBack.mockReturnValue(false);

    const { result } = renderHook(() => useGoBack());
    act(() => result.current());

    expect(replace).toHaveBeenCalledWith('/');
  });
});
