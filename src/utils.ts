import * as jose from 'jose';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { uuid } from '@cfworker/uuid';

import * as CloudflareAuth from './interfaces';

export const generateToken = async (
  email: string,
  env: CloudflareAuth.Env,
  role: string = 'user'
) => {
  const token = uuid();
  // Store the token in the database
  const db = new Kysely<CloudflareAuth.Database>({
    dialect: new D1Dialect({ database: env.DB }),
  });
  const token_row = await db
    .selectFrom('auth_tokens')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();
  if (token_row) {
    await db.deleteFrom('auth_tokens').where('email', '=', email).execute();
  }
  await db.insertInto('auth_tokens').values({ email, token }).execute();

  const users_row = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();
  if (!users_row) {
    const uid = uuid();
    await db
      .insertInto('users')
      .values({ uid, email, verified: 1, role: 'user' })
      .execute();
  }
  return token;
};

export const generateJWT = async (
  uid: string,
  email: string,
  config: CloudflareAuth.AuthConfig
) => {
  const secret = new TextEncoder().encode(config.secretKey);
  const alg = 'HS256';
  return await new jose.SignJWT({ uid, email })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer(config.issuer)
    .setAudience(config.audience)
    .setExpirationTime(config.expiry)
    .sign(secret);
};

export const hashPassword = async (
  password: string,
  config: CloudflareAuth.AuthConfig
) => {
  const hashedPassword = await crypto.subtle.digest(
    {
      name: 'SHA-256',
    },
    new TextEncoder().encode(password + config.salt)
  );
  return String(hashedPassword);
};
