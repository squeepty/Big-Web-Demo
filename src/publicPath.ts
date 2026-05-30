export function getPublicAssetUrl(path: string): string {
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const normalizedPath = path.replace(/^\/+/, '');
  const encodedPath = normalizedPath
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');

  return `${baseUrl}${encodedPath}`;
}
