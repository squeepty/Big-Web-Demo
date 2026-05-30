import { getPublicAssetUrl } from '../../publicPath';

export type ModCatalogEntry = {
  file: string;
  title: string;
};

type AudioManifestEntry = string | {
  file: string;
  title?: string;
};

type AudioManifest = AudioManifestEntry[] | {
  files?: AudioManifestEntry[];
  mods?: AudioManifestEntry[];
  tracks?: AudioManifestEntry[];
};

export async function loadModCatalog(): Promise<ModCatalogEntry[]> {
  const response = await fetch(getPublicAssetUrl('audio/manifest.json'));

  if (!response.ok) {
    return [];
  }

  const manifest = (await response.json()) as AudioManifest;
  const entries = getEntries(manifest);
  const seen = new Set<string>();

  return entries
    .map((entry) => createCatalogEntry(entry))
    .filter((entry): entry is ModCatalogEntry => entry !== null)
    .filter((entry) => {
      if (seen.has(entry.file)) {
        return false;
      }

      seen.add(entry.file);
      return true;
    });
}

function getEntries(manifest: AudioManifest): AudioManifestEntry[] {
  if (Array.isArray(manifest)) {
    return manifest;
  }

  return [
    ...(manifest.mods ?? []),
    ...(manifest.files ?? []),
    ...(manifest.tracks ?? []),
  ];
}

function createCatalogEntry(entry: AudioManifestEntry): ModCatalogEntry | null {
  const file = typeof entry === 'string' ? entry : entry.file;

  if (typeof file !== 'string' || !file.toLowerCase().endsWith('.mod')) {
    return null;
  }

  return {
    file,
    title: typeof entry === 'string' ? createTitle(file) : entry.title ?? createTitle(file),
  };
}

function createTitle(file: string): string {
  const name = file.split('/').pop() ?? file;
  const withoutExtension = name.replace(/\.mod$/i, '');

  return withoutExtension.replace(/[-_]+/g, ' ').trim() || file;
}
