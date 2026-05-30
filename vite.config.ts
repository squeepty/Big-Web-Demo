import { dirname, resolve } from 'node:path';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { defineConfig, type Plugin } from 'vite';

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

      server.middlewares.use(createScrollerTextMiddleware(scrollerTextPath));
      server.watcher.add(scrollerTextPath);
      server.watcher.on('change', (changedPath) => {
        if (changedPath === scrollerTextPath) {
          server.ws.send({ type: 'full-reload', path: '*' });
        }
      });
    },
    configurePreviewServer(server) {
      const scrollerTextPath = resolve(server.config.root, scrollerTextFile);

      server.middlewares.use(
        createScrollerTextMiddleware(scrollerTextPath),
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

function createScrollerTextMiddleware(scrollerTextPath: string) {
  return async (
    req: import('node:http').IncomingMessage,
    res: import('node:http').ServerResponse,
    next: () => void,
  ): Promise<void> => {
    if (getRequestPath(req.url) !== scrollerTextRoute) {
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

function getRequestPath(url: string | undefined): string {
  if (!url) {
    return '';
  }

  return new URL(url, 'http://localhost').pathname;
}

export default defineConfig({
  plugins: [serveLiveScrollerText(), syncScrollerTextToDist()],
  server: {
    open: false,
  },
});
