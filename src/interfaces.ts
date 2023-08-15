import * as jose from 'jose';

export type UserRole = 'user' | 'admin' | 'super';

export interface Env {
  DB: D1Database;
  DKIM_DOMAIN: string;
  DKIM_SELECTOR: string;
  DKIM_PRIVATE_KEY: string;
  COOKIE_NAME: string;
  SECRET_KEY: string;
  ISSUER: string;
  AUDIENCE: string;
  EXPIRY: string;
  ADMIN_EMAIL: string;
  ADMIN_NAME: string;
  SALT: string;
}
export interface UserToken {
  email: string;
  token: string;
}

export interface User {
  uid: string;
  email: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  created_at?: string;
  role: UserRole;
  active?: 0 | 1;
  verified?: 0 | 1;
}

export interface Database {
  auth_tokens: UserToken;
  users: User;
}

export interface JWTPayload extends jose.JWTPayload {
  uid: string;
  email: string;
}
