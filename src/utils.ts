import * as jose from 'jose';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { v4 as uuidv4 } from 'uuid';

import * as CloudflareAuth from './interfaces';

export const generateToken = async (email: string, env: CloudflareAuth.Env) => {
  const token = uuidv4();
  // Store the token in the database
  const db = new Kysely<CloudflareAuth.Database>({
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

export const generateJWT = async (
  uid: string,
  email: string,
  config: CloudflareAuth.AuthConfig
) => {
  const secret = new TextEncoder().encode(config.secretKey);
  const alg = 'HS256';
  const jwt = await new jose.SignJWT({ uid, email })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer(config.issuer)
    .setAudience(config.audience)
    .setExpirationTime(config.expiry)
    .sign(secret);
  console.log('jwt', jwt);
  return jwt;
};
