import * as jose from 'jose';

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
  password?: string;
  verified: 0 | 1;
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

export interface JWTPayload extends jose.JWTPayload {
  uid: string;
  email: string;
}
