import './style.css';
import { DemoApp } from './DemoApp';
import { SecretTrackerPage } from './secret-tracker/SecretTrackerPage';

const mountNode = document.querySelector<HTMLElement>('#app');

if (!mountNode) {
  throw new Error('Could not find #app mount node.');
}

if (isSecretTrackerRoute()) {
  const tracker = new SecretTrackerPage(mountNode);

  tracker.start().catch((error: unknown) => {
    console.error('Secret tracker failed to start.', error);
  });
} else {
  const demo = new DemoApp(mountNode);

  demo.start().catch((error: unknown) => {
    console.error('The Big (Web) Demo failed to start.', error);
  });
}

function isSecretTrackerRoute(): boolean {
  const path = getRoutePath();
  const hash = window.location.hash.toLowerCase();

  return hash === '#tracker' || path === '/tracker' || path === '/secret/tracker';
}

function getRoutePath(): string {
  const path = window.location.pathname.replace(/\/$/, '').toLowerCase();
  const basePath = import.meta.env.BASE_URL
    .replace(/\/$/, '')
    .toLowerCase();

  if (basePath && path === basePath) {
    return '';
  }

  if (basePath && path.startsWith(`${basePath}/`)) {
    return path.slice(basePath.length);
  }

  return path;
}
