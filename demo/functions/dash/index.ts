import { html, htmlResponse } from 'cloudflare-htmx';
import { getJWTPayload, logout, Env } from 'cloudflare-auth';

export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  return logout(env, '/');
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const payload = await getJWTPayload(request, env);
  return htmlResponse(
    html`
      <div class="text-center pt-10 h-screen">
        <form method="post" action="/dash">
          <h1 class="text-3xl text-primary mb-4">This is a protected route</h1>
          <button class="btn btn-secondary w-96 mb-10" type="submit">Logout</button>
          <div>
            ${Object.entries(payload)
              .map(
                ([key, value]) => html`
                  <div class="mb-2">
                    <span class="text-secondary font-bold w-10">${key}: </span>
                    <span>${value}</span>
                  </div>
                `
              )
              .join('')}
          </div>
        </form>
      </div>
    `
  );
};
