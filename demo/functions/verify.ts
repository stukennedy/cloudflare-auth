import { authConfig } from '@src/lib/constants';
import { htmlResponse } from 'cloudflare-htmx';

import { verify } from '../..';
import { Env } from '../../interfaces';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  try {
    return verify(token!, env, authConfig, url);
  } catch {
    return Response.redirect(url.origin, 301);
  }
};
