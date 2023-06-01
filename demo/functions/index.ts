import { html, htmlResponse } from 'cloudflare-htmx';

export const onRequestGet: PagesFunction = () =>
  htmlResponse(html`<div class="w-full h-screen p-10 text-center">
    <div class="flex justify-center pt-24 lg:pt-64">
      <div class="p-4 md:p-0 w-full md:w-96">
        <form hx-post="/login" hx-target="#toaster">
          <div class="text-4xl text-secondary mb-10">Login</div>
          <div class="mb-5 flex justify-center">
            <input
              id="email"
              name="email"
              class="input text-xl bg-neutral h-14 pl-10 pt-2 pb-2 w-full md:w-96"
              type="email"
              placeholder="enter email address"
            />
          </div>
          <div class="flex justify-center">
            <button type="submit" class="btn btn-primary lowercase text-xl w-full md:w-96">Login</button>
          </div>
        </form>
      </div>
    </div>
  </div>`);
