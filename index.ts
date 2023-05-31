import * as jose from 'jose';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'cookie';

export interface Env {
  DB: D1Database;
}

export interface UserToken {
  email: string;
  token: string;
}

export interface User {
  uid: string;
  email: string;
  created_at?: Date;
}

export interface Database {
  user_tokens: UserToken;
  users: User;
}

export interface AuthConfig {
  secretKey: string;
  issuer: string;
  audience: string;
  expiry: string;
  cookieName: string;
  redirectTo: string;
  loginPath: string;
}

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
  const accessCookie = `${config.cookieName}=''; path=/; max-age=-1; SameSite=Lax; HttpOnly; Secure`;
  const response = new Response(
    `<script>window.location.href = '${url.origin}${config.loginPath}';</script>`
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
    throw new Error('No user found');
  }

  const secret = new TextEncoder().encode(config.secretKey);
  const alg = 'HS256';
  const jwt = await new jose.SignJWT({ uid: user.uid, email })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer(config.issuer)
    .setAudience(config.audience)
    .setExpirationTime(config.expiry)
    .sign(secret);
  console.log({ jwt });
  const accessCookie = `${config.cookieName}=${jwt}; path=/; max-age=${config.expiry}; SameSite=Lax; HttpOnly; Secure`;
  return new Response(
    `<script>window.location.href = '${url.origin}${config.redirectTo}';</script>`,
    {
      headers: {
        'Set-Cookie': accessCookie,
        'Content-Type': 'text/html',
      },
    }
  );
};

export const middlewareGuard =
  (authConfig: AuthConfig): PagesFunction =>
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
  authConfig: AuthConfig,
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
