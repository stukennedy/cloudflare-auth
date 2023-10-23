import { Env, loginWithToken } from 'cloudflare-auth';
import Toast from '@components/Toast';
import { html, view } from 'cloudflare-htmx';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const data = await request.formData();
  const email = data.get('email') as string;
  if (!email) {
    return view(Toast('Email not specified'));
  }
  try {
    const magicLink = await loginWithToken(email, env, url.origin, true);
    return view(Toast(html` <a class="link text-primary" href="${magicLink}">Click here to login</a> `, 'alert-success', false));
  } catch (e) {
    console.error(e);
    return view(Toast('Magic link failed to send!', 'alert-failure'));
  }
};
