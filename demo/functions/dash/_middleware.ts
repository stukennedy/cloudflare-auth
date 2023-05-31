import { authConfig } from 'lib/constants';
import { middlewareGuard } from 'cloudflare-auth';

export const onRequest = [middlewareGuard(authConfig)];
