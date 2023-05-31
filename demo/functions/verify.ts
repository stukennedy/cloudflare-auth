import { authConfig } from '@lib/constants';
import { verify, Env } from 'cloudflare-auth';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  try {
    return await verify(token!, env, authConfig, url);
  } catch {
    return Response.redirect(url.origin, 301);
  }
};
