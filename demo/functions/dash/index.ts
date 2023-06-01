import { html, htmlResponse } from 'cloudflare-htmx';
import { logout } from 'cloudflare-auth';
import { authConfig } from '@lib/constants';

export const onRequestPost: PagesFunction = async ({ request }) => {
  return logout(authConfig, new URL(request.url));
};

export const onRequestGet: PagesFunction = () =>
  htmlResponse(
    html`
      <div class="text-center pt-10 h-screen">
        <form method="post" action="/dash">
          <h1 class="text-3xl text-primary mb-4">This is a protected route</h1>
          <button class="btn btn-secondary w-96" type="submit">Logout</button>
        </form>
      </div>
    `
  );
