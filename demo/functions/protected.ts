import { isAuthorised, Env } from 'cloudflare-auth';
import { html, htmlResponse } from 'cloudflare-htmx';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const authorised = await isAuthorised(request, env);
  if (authorised) {
    return htmlResponse(html`<h1 class="text-3xl text-primary">You are authorised!</h1>`);
  }
  return htmlResponse(html`<h1 class="text-3xl text-error">You are not authorised!</h1>`);
};
