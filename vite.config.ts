import { dirname, resolve } from 'node:path';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { defineConfig, type Plugin } from 'vite';

const githubPagesBase = '/Big-Web-Demo/';
const scrollerTextRoute = '/text/scroller-message.txt';
const scrollerTextFile = 'public/text/scroller-message.txt';

function serveLiveScrollerText(): Plugin {
  return {
    name: 'serve-live-scroller-text',
    configureServer(server) {
      const scrollerTextPath = resolve(
        server.config.root,
        scrollerTextFile,
      );
      const scrollerTextRoutes = getPublicRouteCandidates(
        server.config.base,
        scrollerTextRoute,
      );

      server.middlewares.use(createScrollerTextMiddleware(scrollerTextPath, scrollerTextRoutes));
      server.watcher.add(scrollerTextPath);
      server.watcher.on('change', (changedPath) => {
        if (changedPath === scrollerTextPath) {
          server.ws.send({ type: 'full-reload', path: '*' });
        }
      });
    },
    configurePreviewServer(server) {
      const scrollerTextPath = resolve(server.config.root, scrollerTextFile);
      const scrollerTextRoutes = getPublicRouteCandidates(
        server.config.base,
        scrollerTextRoute,
      );

      server.middlewares.use(
        createScrollerTextMiddleware(scrollerTextPath, scrollerTextRoutes),
      );
    },
  };
}

function syncScrollerTextToDist(): Plugin {
  let root = process.cwd();
  let outDir = 'dist';

  return {
    name: 'sync-scroller-text-to-dist',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      outDir = config.build.outDir;
    },
    async closeBundle() {
      const sourcePath = resolve(root, scrollerTextFile);
      const outputPath = resolve(root, outDir, scrollerTextRoute.slice(1));

      await mkdir(dirname(outputPath), { recursive: true });
      await copyFile(sourcePath, outputPath);
    },
  };
}

function copyIndexTo404(): Plugin {
  let root = process.cwd();
  let outDir = 'dist';

  return {
    name: 'copy-index-to-404',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      outDir = config.build.outDir;
    },
    async closeBundle() {
      const outputRoot = resolve(root, outDir);

      await copyFile(
        resolve(outputRoot, 'index.html'),
        resolve(outputRoot, '404.html'),
      );
    },
  };
}

function createScrollerTextMiddleware(scrollerTextPath: string, routes: Set<string>) {
  return async (
    req: import('node:http').IncomingMessage,
    res: import('node:http').ServerResponse,
    next: () => void,
  ): Promise<void> => {
    if (!routes.has(getRequestPath(req.url))) {
      next();
      return;
    }

    try {
      const message = await readFile(scrollerTextPath, 'utf8');

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.end(message);
    } catch {
      next();
    }
  };
}

function getPublicRouteCandidates(base: string, route: string): Set<string> {
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  const normalizedBase = `/${base.replace(/^\/+|\/+$/g, '')}`;
  const routes = new Set([normalizedRoute]);

  if (normalizedBase !== '/') {
    routes.add(`${normalizedBase}${normalizedRoute}`);
  }

  return routes;
}

function getRequestPath(url: string | undefined): string {
  if (!url) {
    return '';
  }

  return new URL(url, 'http://localhost').pathname;
}

export default defineConfig({
  base: githubPagesBase,
  plugins: [serveLiveScrollerText(), syncScrollerTextToDist(), copyIndexTo404()],
  server: {
    open: false,
  },
});
