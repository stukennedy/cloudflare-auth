import { Env } from '../../interfaces';
import { login } from '../../';
import { sendEmail } from '@src/lib/email';
import Toast from '@src/components/Toast';
import { htmlResponse } from 'cloudflare-htmx';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const data = await request.formData();
  const email = data.get('email') as string;
  if (!email) {
    return htmlResponse(Toast('Email not specified'));
  }
  const token = await login(email, env);
  const magicLink = `${url.origin}/verify?token=${token}`;
  try {
    await sendEmail(email, magicLink);
    console.log({ magicLink });
    return htmlResponse(Toast('Check your email for magic link.'));
  } catch {
    return htmlResponse(Toast('Magic link failed to send!', 'alert-failure'));
  }
};
