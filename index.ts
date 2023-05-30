import * as jose from 'jose';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'cookie';
import { Env, Database, AuthConfig } from './interfaces';

export const login = async (email: string, env: Env) => {
  const token = uuidv4();
  // Store the token in the database
  console.log({ email, token });
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: env.DB }),
  });
  const token_row = await db
    .selectFrom('user_tokens')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();
  if (token_row) {
    await db.deleteFrom('user_tokens').where('email', '=', email).execute();
  }
  await db.insertInto('user_tokens').values({ email, token }).execute();

  const users_row = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();
  if (!users_row) {
    const uid = uuidv4();
    await db.insertInto('users').values({ uid, email }).execute();
  }
  return token;
};

export const logout = async (
  config: AuthConfig,
  url: URL
): Promise<Response> => {
  const accessCookie = `${config.COOKIE_NAME}=''; path=/; max-age=-1; SameSite=Lax; HttpOnly; Secure`;
  const response = new Response(
    `<script>window.location.href = '${url.origin}/';</script>`
  );
  response.headers.set('Set-Cookie', accessCookie);
  response.headers.set('Content-Type', 'text/html');
  return response;
};

export const verify = async (
  token: string,
  env: Env,
  config: AuthConfig,
  url: URL
): Promise<Response> => {
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: env.DB }),
  });
  const row = await db
    .selectFrom('user_tokens')
    .selectAll()
    .where('token', '=', token)
    .executeTakeFirst();
  if (!row) {
    throw new Error('Token not found');
  }
  const email = row.email;
  await db.deleteFrom('user_tokens').where('token', '=', token).execute();
  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();
  if (!user) {
    return new Response('No user found.', { status: 401 });
  }

  const secret = new TextEncoder().encode(config.SECRET_KEY);
  const alg = 'HS256';
  const jwt = await new jose.SignJWT({ uid: user.uid, email })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer(config.ISSUER)
    .setAudience(config.AUDIENCE)
    .setExpirationTime(config.EXPIRY)
    .sign(secret);
  console.log({ jwt });
  const accessCookie = `${config.COOKIE_NAME}=${jwt}; path=/; max-age=${config.EXPIRY}; SameSite=Lax; HttpOnly; Secure`;
  const response = new Response(
    `<script>window.location.href = '${url.origin}/dash/';</script>`
  );
  response.headers.set('Set-Cookie', accessCookie);
  response.headers.set('Content-Type', 'text/html');
  return response;
};

export const routeGuard =
  (authConfig: AuthConfig): PagesFunction =>
  async ({ request, next }) => {
    console.log('/dash/_middleware.ts');
    const cookie = parse(request.headers.get('Cookie') || '');
    const jwt = cookie[authConfig.COOKIE_NAME];
    console.log({ jwt });
    const secret = new TextEncoder().encode(authConfig.SECRET_KEY);
    try {
      await jose.jwtVerify(jwt, secret, {
        issuer: authConfig.ISSUER,
        audience: authConfig.AUDIENCE,
      });
      return next();
    } catch {
      const url = new URL(request.url);
      return Response.redirect(url.origin, 301);
    }
  };
