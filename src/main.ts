import './style.css';
import { DemoApp } from './DemoApp';

const mountNode = document.querySelector<HTMLElement>('#app');

if (!mountNode) {
  throw new Error('Could not find #app mount node.');
}

const demo = new DemoApp(mountNode);

demo.start().catch((error: unknown) => {
  console.error('Big Web Demo failed to start.', error);
});
