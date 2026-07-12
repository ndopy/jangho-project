import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminKeyGuard } from './admin-key.guard';

function createContext(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

describe('AdminKeyGuard', () => {
  function createGuard(expectedKey: string | undefined) {
    const configService = {
      get: jest.fn().mockReturnValue(expectedKey),
    } as unknown as ConfigService;

    return new AdminKeyGuard(configService);
  }

  it('x-admin-key 헤더가 ADMIN_API_KEY와 일치하면 통과시킨다', () => {
    const guard = createGuard('secret-key');

    const result = guard.canActivate(
      createContext({ 'x-admin-key': 'secret-key' }),
    );

    expect(result).toBe(true);
  });

  it('x-admin-key 헤더가 ADMIN_API_KEY와 다르면 예외를 던진다', () => {
    const guard = createGuard('secret-key');

    expect(() =>
      guard.canActivate(createContext({ 'x-admin-key': 'wrong-key' })),
    ).toThrow(UnauthorizedException);
  });

  it('x-admin-key 헤더가 없으면 예외를 던진다', () => {
    const guard = createGuard('secret-key');

    expect(() => guard.canActivate(createContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('서버에 ADMIN_API_KEY가 설정되어 있지 않으면 무조건 예외를 던진다', () => {
    const guard = createGuard(undefined);

    expect(() =>
      guard.canActivate(createContext({ 'x-admin-key': 'anything' })),
    ).toThrow(UnauthorizedException);
  });
});
