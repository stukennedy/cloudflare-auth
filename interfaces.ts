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
  created_at?: Date;
}

export interface Database {
  user_tokens: UserToken;
  users: User;
}

export interface AuthConfig {
  SECRET_KEY: string;
  ISSUER: string;
  AUDIENCE: string;
  EXPIRY: string;
  COOKIE_NAME: string;
}
