import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';

import * as CloudflareAuth from './interfaces';
import { generateJWT, generateToken, hashPassword } from './utils';
import { sendLoginMagicLinkEmail } from './email';

export const loginWithPassword = async (
  email: string,
  password: string,
  env: CloudflareAuth.Env
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
  const hashedPassword = await hashPassword(password, env);
  if (hashedPassword !== users_row.password) {
    throw new Error('Invalid password');
  }
  return users_row;
};

export const loginWithToken = async (
  email: string,
  env: CloudflareAuth.Env,
  urlOrigin: string,
  allowUserSignup = false
) => {
  const db = new Kysely<CloudflareAuth.Database>({
    dialect: new D1Dialect({ database: env.DB }),
  });
  const users_row = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();
  if (!users_row && !allowUserSignup) {
    throw new Error('User not found');
  }
  const token = await generateToken(email, env);
  const magicLink = `${urlOrigin}/verify?token=${token}`;
  await sendLoginMagicLinkEmail(urlOrigin, email, magicLink, env);
  return magicLink;
};

export const verify = async (
  token: string,
  env: CloudflareAuth.Env,
  redirectTo: string
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

  const jwt = await generateJWT(user.uid, email, env);
  const accessCookie = `${env.COOKIE_NAME}=${jwt}; path=/; max-age=${env.EXPIRY}; SameSite=Lax; HttpOnly; Secure`;
  return new Response(null, {
    status: 301,
    headers: {
      Location: redirectTo,
      'Set-Cookie': accessCookie,
    },
  });
};

export const logout = async (
  env: CloudflareAuth.Env,
  loginPath: string
): Promise<Response> => {
  const accessCookie = `${env.COOKIE_NAME}=''; path=/; max-age=-1; SameSite=Lax; HttpOnly; Secure`;
  return new Response(null, {
    status: 301,
    headers: {
      Location: loginPath,
      'Set-Cookie': accessCookie,
    },
  });
};
