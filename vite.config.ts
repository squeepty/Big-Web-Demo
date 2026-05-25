import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

function reloadWhenScrollerTextChanges(): Plugin {
  return {
    name: 'reload-when-scroller-text-changes',
    configureServer(server) {
      const scrollerTextPath = resolve(
        server.config.root,
        'public/text/scroller-message.txt',
      );

      server.watcher.add(scrollerTextPath);
      server.watcher.on('change', (changedPath) => {
        if (changedPath === scrollerTextPath) {
          server.ws.send({ type: 'full-reload', path: '*' });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [reloadWhenScrollerTextChanges()],
  server: {
    open: false,
  },
});
