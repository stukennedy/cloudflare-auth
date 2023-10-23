import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { uuid } from '@cfworker/uuid';

import * as CloudflareAuth from './interfaces';
import { generateJWT, generateToken, hashPassword } from './utils';

export const signupWithPassword = async (
  email: string,
  password: string,
  env: CloudflareAuth.Env
) => {
  const db = new Kysely<CloudflareAuth.Database>({
    dialect: new D1Dialect({ database: env.DB }),
  });
  const hashedPassword = await hashPassword(password, env);
  const uid = uuid();
  await db
    .insertInto('users')
    .values({ uid, email, password: hashedPassword, role: 'user' })
    .execute();
  return await generateToken(email, env);
};

export const verifyEmail = async (
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
    .where('verified', '=', 0)
    .executeTakeFirst();
  if (!user) {
    throw new Error('No unverified user found');
  }
  await db
    .updateTable('users')
    .set({ verified: 1 })
    .where('email', '=', email)
    .execute();

  const jwt = await generateJWT(user.uid, email, env);
  const accessCookie = `${env.COOKIE_NAME}=${jwt}; path=/; max-age=${env.EXPIRY}; SameSite=Lax; HttpOnly; Secure`;
  return new Response(null, {
    status: 303,
    headers: {
      Location: redirectTo,
      'Set-Cookie': accessCookie,
    },
  });
};
