import { Env, loginWithToken } from 'cloudflare-auth';
import Toast from '@components/Toast';
import { html, htmlResponse } from 'cloudflare-htmx';
import { authConfig } from '@lib/constants';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const data = await request.formData();
  const email = data.get('email') as string;
  if (!email) {
    return htmlResponse(Toast('Email not specified'));
  }
  try {
    const magicLink = await loginWithToken(email, env, url.origin, authConfig);
    return htmlResponse(Toast(html` <a class="link text-primary" href="${magicLink}">Click here to login</a> `, 'alert-success', false));
  } catch (e) {
    console.error(e);
    return htmlResponse(Toast('Magic link failed to send!', 'alert-failure'));
  }
};
