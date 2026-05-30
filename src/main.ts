import './style.css';
import { DemoApp } from './DemoApp';
import { SecretTrackerPage } from './secret-tracker/SecretTrackerPage';

const mountNode = document.querySelector<HTMLElement>('#app');

if (!mountNode) {
  throw new Error('Could not find #app mount node.');
}

const appMountNode = mountNode;

type RunningApp = DemoApp | SecretTrackerPage;

let runningApp: RunningApp | null = null;

if (isSecretTrackerRoute()) {
  void showTracker();
} else {
  void showDemo();
}

window.addEventListener('hashchange', () => {
  if (isSecretTrackerRoute() && !(runningApp instanceof SecretTrackerPage)) {
    void showTracker();
  }
});

async function showDemo(): Promise<void> {
  runningApp?.destroy();
  const demo = new DemoApp(appMountNode, showTrackerRoute);

  runningApp = demo;

  try {
    await demo.start();
  } catch (error: unknown) {
    console.error('The Big (Web) Demo failed to start.', error);
  }
}

async function showTracker(): Promise<void> {
  runningApp?.destroy();
  const tracker = new SecretTrackerPage(appMountNode);

  runningApp = tracker;

  try {
    await tracker.start();
  } catch (error: unknown) {
    console.error('Secret tracker failed to start.', error);
  }
}

function showTrackerRoute(): void {
  if (window.location.hash.toLowerCase() !== '#tracker') {
    window.history.pushState(null, '', `${import.meta.env.BASE_URL}#tracker`);
  }

  void showTracker();
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
