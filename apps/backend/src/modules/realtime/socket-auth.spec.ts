import { Role } from '@prisma/client';
import { principalFromAccessPayload, readSocketAccessToken } from './socket-auth';

describe('socket-auth', () => {
  it('reads the handshake auth token first', () => {
    expect(
      readSocketAccessToken({
        authToken: ' from-auth ',
        authorizationHeader: 'Bearer from-header',
      }),
    ).toBe('from-auth');
  });

  it('reads a Bearer header when auth token is empty', () => {
    expect(
      readSocketAccessToken({
        authToken: '  ',
        authorizationHeader: 'Bearer header-token',
      }),
    ).toBe('header-token');
  });

  it('rejects a missing token', () => {
    expect(readSocketAccessToken({})).toBeNull();
  });

  it('accepts a sub and role payload', () => {
    expect(
      principalFromAccessPayload({ sub: 'user-1', role: Role.customer }),
    ).toEqual({ userId: 'user-1', role: Role.customer });
  });

  it('rejects a payload without a known role', () => {
    expect(principalFromAccessPayload({ sub: 'user-1', role: 'shop' })).toBeNull();
    expect(principalFromAccessPayload({ role: Role.admin })).toBeNull();
  });
});
