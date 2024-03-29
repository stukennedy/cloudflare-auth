import { verify, Env } from 'cloudflare-auth';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  try {
    return await verify(token!, env, '/dash');
  } catch {
    return Response.redirect(url.origin, 303);
  }
};
