import { authConfig } from '@lib/constants';
import { isAuthorised, Env } from 'cloudflare-auth';
import { html, htmlResponse } from 'cloudflare-htmx';

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const authorised = await isAuthorised(authConfig, request);
  if (authorised) {
    return htmlResponse(html`<h1 class="text-3xl text-primary">You are authorised!</h1>`);
  }
  return htmlResponse(html`<h1 class="text-3xl text-error">You are not authorised!</h1>`);
};
