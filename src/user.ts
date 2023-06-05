import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { v4 as uuidv4 } from 'uuid';

import * as CloudflareAuth from './interfaces';
import { generateJWT, generateToken, hashPassword } from './utils';

export const signup = async (
  email: string,
  password: string,
  env: CloudflareAuth.Env
) => {
  const db = new Kysely<CloudflareAuth.Database>({
    dialect: new D1Dialect({ database: env.DB }),
  });
  const hashedPassword = await hashPassword(password);
  const uid = uuidv4();
  await db
    .insertInto('users')
    .values({ uid, email, password: hashedPassword, verified: false })
    .execute();
  return await generateToken(email, env);
};

export const verifyEmail = async (
  token: string,
  env: CloudflareAuth.Env,
  config: CloudflareAuth.AuthConfig,
  url: URL
): Promise<Response> => {
  const db = new Kysely<CloudflareAuth.Database>({
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
    .where('verified', '=', false)
    .executeTakeFirst();
  if (!user) {
    throw new Error('No unverified user found');
  }
  await db
    .updateTable('users')
    .set({ verified: true })
    .where('email', '=', email)
    .execute();

  const jwt = await generateJWT(user.uid, email, config);
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
