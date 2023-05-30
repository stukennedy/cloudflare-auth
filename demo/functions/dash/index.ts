import { html, htmlResponse } from 'cloudflare-htmx';
import { logout } from '../../..';
import { authConfig } from '@src/lib/constants';

export const onRequestPost: PagesFunction = async ({ request }) => {
  return logout(authConfig, new URL(request.url));
};

export const onRequestGet: PagesFunction = () =>
  htmlResponse(
    html`
      <form method="post" action="/dash">
        <h1>Protected Route</h1>
        <button type="submit">Logout</button>
      </form>
    `
  );
