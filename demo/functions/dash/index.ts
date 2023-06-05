import { html, htmlResponse } from 'cloudflare-htmx';
import { getJWTPayload, logout } from 'cloudflare-auth';
import { authConfig } from '@lib/constants';

export const onRequestPost: PagesFunction = async ({ request }) => {
  return logout(authConfig, new URL(request.url));
};

export const onRequestGet: PagesFunction = async ({ request }) => {
  const payload = await getJWTPayload(authConfig, request);
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
