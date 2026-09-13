import { buildInviteLink, parseInviteCode } from '@/lib/invite-link';

describe('buildInviteLink', () => {
  it('points at the join route for the code', () => {
    expect(buildInviteLink('ABCD2345')).toBe('ghumi://join/ABCD2345');
  });
});

describe('parseInviteCode', () => {
  it('reads a code from a custom-scheme link', () => {
    expect(parseInviteCode('ghumi://join/ABCD2345')).toBe('ABCD2345');
  });

  it('reads a code from the exp:// shape Expo Go uses', () => {
    expect(parseInviteCode('exp://192.168.0.4:8081/--/join/ABCD2345')).toBe('ABCD2345');
  });

  it('upper-cases a code typed or shared in lower case', () => {
    expect(parseInviteCode('ghumi://join/abcd2345')).toBe('ABCD2345');
  });

  it('ignores a trailing query string', () => {
    expect(parseInviteCode('ghumi://join/ABCD2345?from=whatsapp')).toBe('ABCD2345');
  });

  it('returns null for links that are not invites', () => {
    expect(parseInviteCode('ghumi://auth/callback#access_token=abc')).toBeNull();
    expect(parseInviteCode('https://example.com')).toBeNull();
  });

  it('returns null when the code is too short to be one of ours', () => {
    expect(parseInviteCode('ghumi://join/AB')).toBeNull();
  });
});
