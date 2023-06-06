import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';

import * as CloudflareAuth from './interfaces';
import { generateJWT, hashPassword } from './utils';

export const login = async (
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
  if (users_row.verified === 0) {
    throw new Error('User not verified');
  }
  const hashedPassword = await hashPassword(password);
  if (hashedPassword !== users_row.password) {
    throw new Error('Invalid password');
  }
};

export const verify = async (
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
    .executeTakeFirst();
  if (!user) {
    throw new Error('No user found');
  }

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

export const logout = async (
  config: CloudflareAuth.AuthConfig,
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
