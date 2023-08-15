import { middlewareGuard } from 'cloudflare-auth';

export const onRequest = [middlewareGuard];
