import { html, LayoutFunction } from 'cloudflare-htmx';

// this is the layout for the entire site
const _layout: LayoutFunction = ({ children }) => {
  const title = 'Cloudflare Pages + HTMX + Hyperscript';
  return html`
    <!DOCTYPE html>
    <html lang="en" data-theme="mytheme">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <link href="/css/output.css" rel="stylesheet" />
        <script src="/js/htmx.min.js"></script>
        <script src="/js/_hyperscript.min.js"></script>
      </head>
      <body class="bg-base-300">
        ${children}
        <div id="toaster"></div>
        <div id="modal"></div>
      </body>
    </html>
  `;
};
export default _layout;
