# cloudflare-auth - Simple Auth for Cloudflare Pages

## Getting started

### Add it to your Cloudflare Pages application

```bash
pnpm i cloudflare-auth
```

### Define your AuthConfig

```typescript
// src/lib/constants.ts

export const authConfig = {
  secretKey: 'this_is_your_secretKey',
  issuer: 'urn:continuata:issuer',
  audience: 'urn:continuata:audience',
  expiry: '2h',
  cookieName: 'cf-auth-token',
  redirectTo: '/dash',
  loginPath: '/',
};
```

### Add a magic link login endpoint

```typescript
// functions/login.ts
import { generateToken, Env } from 'cloudflare-auth';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const data = await request.formData();
  const email = data.get('email') as string;
  if (!email) {
    return new Response('No email');
  }
  const token = await generateToken(email, env);
  const magicLink = `${url.origin}/verify?token=${token}`;
  // normally send magicLink in an email to the user
  return new Response(
    `
      <a class="link text-primary" href="${magicLink}">Click here to login</a>
    `,
    { headers: { 'content-type': 'text/html' } }
  );
};
```

### Handle the verification link resolution

This will automatically redirect to the `redirectTo` path in your config

```typescript
// functions/verify.ts
import { authConfig } from '@lib/constants';
import { verify, Env } from 'cloudflare-auth';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  try {
    return await verify(token!, env, authConfig, url);
  } catch {
    return Response.redirect(url.origin, 303);
  }
};
```

### Add middleware to guard all routes with authentication

```typescript
// functions/dashboard/_middleware.ts

import { authConfig } from 'lib/constants';
import { middlewareGuard } from 'cloudflare-auth';

export const onRequest = [middlewareGuard(authConfig)];
```

### ... or check individual routes internally

```typescript
// functions/protected.ts

import { authConfig } from '@lib/constants';
import { isAuthorised, Env } from 'cloudflare-auth';

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const authorised = await isAuthorised(authConfig, request);
  if (authorised) {
    return new Response(
      html`<h1 class="text-3xl text-primary">You are authorised!</h1>`,
      { headers: { 'content-type': 'text/html' } }
    );
  }
  return new Response(
    html`<h1 class="text-3xl text-error">You are not authorised!</h1>`,
    { headers: { 'content-type': 'text/html' } }
  );
};
```

### Logout

This will automatically redirect to the `loginPath` in your config

```typescript
import { logout } from 'cloudflare-auth';
import { authConfig } from '@lib/constants';

export const onRequestPost: PagesFunction = async ({ request }) => {
  return logout(authConfig, new URL(request.url));
};
```
