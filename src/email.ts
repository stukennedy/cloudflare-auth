import { Env } from './interfaces';
import type { AuthConfig } from './interfaces';

export const sendEmail = async (urlOrigin: string, payload: any) => {
  // Mailchannels not supported on localhost so just log the email
  if (new URL(urlOrigin).hostname === '127.0.0.1') {
    console.log('Email: ', JSON.stringify(payload, null, 2));
    return true;
  } else {
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 202) return true;

    try {
      const data = await response.clone().json();
      console.log(
        'Error sending mailchannels email: ',
        JSON.stringify(data, null, 2)
      );
      return false;
    } catch {
      console.log('Error sending mailchannels email: ', response.statusText);
      return false;
    }
  }
};

export const sendSignupMagicLinkEmail = async (
  urlOrigin: string,
  to: string,
  link: string,
  env: Env,
  config: AuthConfig
) => {
  return await sendEmail(urlOrigin, {
    personalizations: [
      {
        to: [{ email: to }],
        dkim_domain: env.DKIM_DOMAIN,
        dkim_selector: env.DKIM_SELECTOR,
        dkim_private_key: env.DKIM_PRIVATE_KEY,
      },
    ],
    from: {
      email: config.adminEmail,
      name: config.adminName,
    },
    subject: 'Verify your email address',
    content: [
      {
        type: 'text/plain',
        value: 'Click this link to verify your email address: ' + link,
      },
    ],
  });
};

export const sendLoginMagicLinkEmail = async (
  urlOrigin: string,
  to: string,
  link: string,
  env: Env,
  config: AuthConfig
) => {
  return await sendEmail(urlOrigin, {
    personalizations: [
      {
        to: [{ email: to }],
        dkim_domain: env.DKIM_DOMAIN,
        dkim_selector: env.DKIM_SELECTOR,
        dkim_private_key: env.DKIM_PRIVATE_KEY,
      },
    ],
    from: {
      email: config.adminEmail,
      name: config.adminName,
    },
    subject: 'Confirm login',
    content: [
      {
        type: 'text/plain',
        value: 'Click this link to login: ' + link,
      },
    ],
  });
};
