import * as jose from 'jose';

export interface Env {
  DB: D1Database;
  DKIM_DOMAIN: string;
  DKIM_SELECTOR: string;
  DKIM_PRIVATE_KEY: string;
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
  role: 'user' | 'admin' | 'super';
  active?: 0 | 1;
  verified?: 0 | 1;
}

export interface Database {
  auth_tokens: UserToken;
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
  allowUserSignup: boolean;
  salt: string;
  adminEmail: string;
  adminName: string;
}

export interface JWTPayload extends jose.JWTPayload {
  uid: string;
  email: string;
}
