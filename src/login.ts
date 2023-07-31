import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';

import * as CloudflareAuth from './interfaces';
import { generateJWT, generateToken, hashPassword } from './utils';
import { sendLoginMagicLinkEmail } from './email';

export const loginWithPassword = async (
  email: string,
  password: string,
  env: CloudflareAuth.Env,
  config: CloudflareAuth.AuthConfig
) => {
  const db = new Kysely<CloudflareAuth.Database>({
    dialect: new D1Dialect({ database: env.DB }),
  });
  const users_row = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();
  if (!users_row) {
    throw new Error('User not found');
  }
  const hashedPassword = await hashPassword(password, config);
  if (hashedPassword !== users_row.password) {
    throw new Error('Invalid password');
  }
  return users_row;
};

export const loginWithToken = async (
  email: string,
  env: CloudflareAuth.Env,
  urlOrigin: string,
  config: CloudflareAuth.AuthConfig
) => {
  const db = new Kysely<CloudflareAuth.Database>({
    dialect: new D1Dialect({ database: env.DB }),
  });
  const users_row = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();
  if (!users_row && !config.allowUserSignup) {
    throw new Error('User not found');
  }
  const token = await generateToken(email, env);
  const magicLink = `${urlOrigin}/verify?token=${token}`;
  await sendLoginMagicLinkEmail(urlOrigin, email, magicLink, env, config);
  return magicLink;
};

export const verify = async (
  token: string,
  env: CloudflareAuth.Env,
  config: CloudflareAuth.AuthConfig
): Promise<Response> => {
  const db = new Kysely<CloudflareAuth.Database>({
    dialect: new D1Dialect({ database: env.DB }),
  });
  const row = await db
    .selectFrom('auth_tokens')
    .selectAll()
    .where('token', '=', token)
    .executeTakeFirst();
  if (!row) {
    throw new Error('Token not found');
  }
  const email = row.email;
  await db.deleteFrom('auth_tokens').where('token', '=', token).execute();
  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();
  if (!user) {
    throw new Error('No user found');
  }

  const jwt = await generateJWT(user.uid, email, config);
  const accessCookie = `${config.cookieName}=${jwt}; path=/; max-age=${config.expiry}; SameSite=Lax; HttpOnly; Secure`;
  return new Response(null, {
    status: 301,
    headers: {
      Location: config.redirectTo,
      'Set-Cookie': accessCookie,
    },
  });
};

export const logout = async (
  config: CloudflareAuth.AuthConfig
): Promise<Response> => {
  const accessCookie = `${config.cookieName}=''; path=/; max-age=-1; SameSite=Lax; HttpOnly; Secure`;
  return new Response(null, {
    status: 301,
    headers: {
      Location: config.loginPath,
      'Set-Cookie': accessCookie,
    },
  });
};
