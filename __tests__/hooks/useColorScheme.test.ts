import { renderHook } from '@testing-library/react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

describe('useColorScheme', () => {
  it('returns a valid colour scheme or null', () => {
    const { result } = renderHook(() => useColorScheme());
    expect(['light', 'dark', null, undefined]).toContain(result.current);
  });
});
