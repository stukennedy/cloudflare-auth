import * as jose from 'jose';
import { parse } from 'cookie';

import * as CloudflareAuth from './interfaces';

export const middlewareGuard: PagesFunction<CloudflareAuth.Env> = async ({
  request,
  next,
  env,
}) => {
  const cookie = parse(request.headers.get('Cookie') || '');
  const jwt = cookie[env.COOKIE_NAME];
  const secret = new TextEncoder().encode(env.SECRET_KEY);
  try {
    await jose.jwtVerify(jwt, secret, {
      issuer: env.ISSUER,
      audience: env.AUDIENCE,
    });
    return next();
  } catch {
    const url = new URL(request.url);
    return Response.redirect(url.origin, 303);
  }
};

export const isAuthorised = async (
  request: Request,
  env: CloudflareAuth.Env
): Promise<boolean> => {
  const cookie = parse(request.headers.get('Cookie') || '');
  const jwt = cookie[env.COOKIE_NAME];
  const secret = new TextEncoder().encode(env.SECRET_KEY);
  try {
    await jose.jwtVerify(jwt, secret, {
      issuer: env.ISSUER,
      audience: env.AUDIENCE,
    });
    return true;
  } catch {
    return false;
  }
};

export const getJWTPayload = async (
  request: Request,
  env: CloudflareAuth.Env
): Promise<CloudflareAuth.JWTPayload> => {
  const cookie = parse(request.headers.get('Cookie') || '');
  const jwt = cookie[env.COOKIE_NAME];
  return jose.decodeJwt(jwt) as CloudflareAuth.JWTPayload;
};
