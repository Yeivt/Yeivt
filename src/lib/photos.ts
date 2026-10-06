import manifest from '../content/photos.json';

export type Photo = {
  alt?: string;
  src: string;
  variants: { width: number; src: string }[];
  width: number;
  height: number;
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  originalUrl: string;
};

const photos = manifest as Record<string, Photo>;
export function getPhoto(id: string): Photo | undefined { return photos[id]; }
