import * as jose from 'jose';
import { parse } from 'cookie';

import * as CloudflareAuth from './interfaces';

export const middlewareGuard =
  (authConfig: CloudflareAuth.AuthConfig): PagesFunction =>
  async ({ request, next }) => {
    const cookie = parse(request.headers.get('Cookie') || '');
    const jwt = cookie[authConfig.cookieName];
    const secret = new TextEncoder().encode(authConfig.secretKey);
    try {
      await jose.jwtVerify(jwt, secret, {
        issuer: authConfig.issuer,
        audience: authConfig.audience,
      });
      return next();
    } catch {
      const url = new URL(request.url);
      return Response.redirect(url.origin, 301);
    }
  };

export const isAuthorised = async (
  authConfig: CloudflareAuth.AuthConfig,
  request: Request
): Promise<boolean> => {
  const cookie = parse(request.headers.get('Cookie') || '');
  const jwt = cookie[authConfig.cookieName];
  const secret = new TextEncoder().encode(authConfig.secretKey);
  try {
    await jose.jwtVerify(jwt, secret, {
      issuer: authConfig.issuer,
      audience: authConfig.audience,
    });
    return true;
  } catch {
    return false;
  }
};

export const getJWTPayload = async (
  authConfig: CloudflareAuth.AuthConfig,
  request: Request
): Promise<jose.JWTPayload> => {
  const cookie = parse(request.headers.get('Cookie') || '');
  const jwt = cookie[authConfig.cookieName];
  return jose.decodeJwt(jwt);
};
