import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { ROLES_KEY } from '../decorators/roles.decorator';

function mockContext(user?: { role: Role }) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as never;
}

describe('RolesGuard', () => {
  it('allows when no roles required', () => {
    const reflector = {
      getAllAndOverride: () => undefined,
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(mockContext({ role: Role.customer }))).toBe(true);
  });

  it('allows matching role', () => {
    const reflector = {
      getAllAndOverride: (_key: string) =>
        _key === ROLES_KEY ? [Role.admin] : undefined,
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(mockContext({ role: Role.admin }))).toBe(true);
  });

  it('forbids mismatched role', () => {
    const reflector = {
      getAllAndOverride: () => [Role.admin],
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(mockContext({ role: Role.driver }))).toThrow(
      ForbiddenException,
    );
  });
});
