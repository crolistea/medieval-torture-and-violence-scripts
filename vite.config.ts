import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// GitHub Project Pages serves this site from /<repository-name>/, so every
// asset URL has to start with that path. Change this if the repository is renamed.
const REPOSITORY_BASE = '/medieval-shit-and-violence-script/'

// The Pages workflow passes the real base path reported by GitHub
// (actions/configure-pages), which keeps the build correct after a rename
// or when a custom domain is added. Local builds fall back to the constant.
function resolveBase(): string {
  const fromPages = process.env.PAGES_BASE_PATH
  if (fromPages === undefined) return REPOSITORY_BASE
  const trimmed = fromPages.replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : '/'
}

// The app uses hash routing, so GitHub Pages only ever has to serve index.html.
// This 404 page catches hand-typed paths without the "#" and forwards them to
// the matching hash route instead of showing GitHub's default error page.
function pagesNotFound(base: string): Plugin {
  return {
    name: 'pages-not-found',
    apply: 'build',
    generateBundle() {
      const source = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Redirecting</title>
    <style>
      html { background: #07090c; color: #e8ecf2; font-family: system-ui, sans-serif; }
      body { margin: 0; padding: 48px 24px; }
      a { color: #6f96ff; }
    </style>
    <script>
      (function () {
        var base = ${JSON.stringify(base)};
        var path = location.pathname;
        var rest = path.indexOf(base) === 0 ? path.slice(base.length) : '';
        rest = rest.replace(/\\/+$/, '');
        location.replace(base + (rest ? '#/' + rest : ''));
      })();
    </script>
  </head>
  <body>
    <p>This page moved. <a href="${base}">Open the home page</a>.</p>
  </body>
</html>
`
      this.emitFile({ type: 'asset', fileName: '404.html', source })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(() => {
  const base = resolveBase()
  return {
    base,
    plugins: [react(), pagesNotFound(base)],
  }
})
