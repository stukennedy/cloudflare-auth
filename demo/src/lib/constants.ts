import { AuthConfig } from '../../../interfaces';

export const authConfig: AuthConfig = {
  SECRET_KEY: 'this_is_your_Secret_Key',
  ISSUER: 'urn:continuata:issuer',
  AUDIENCE: 'urn:continuata:audience',
  EXPIRY: '2h',
  COOKIE_NAME: 'cf-auth-token',
};
