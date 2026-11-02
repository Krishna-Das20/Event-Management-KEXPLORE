/** Request an appropriately-sized image from the Unsplash CDN instead of the full 1600px original. */
export function sized(url, width, quality = 72) {
  if (!url?.includes('images.unsplash.com')) return url;
  const u = new URL(url);
  u.searchParams.set('w', String(width));
  u.searchParams.set('q', String(quality));
  u.searchParams.set('auto', 'format');
  u.searchParams.set('fit', 'crop');
  return u.toString();
}

/** srcSet for responsive <img> tags. */
export const srcSet = (url, widths = [400, 640, 960, 1280]) => widths.map((w) => `${sized(url, w)} ${w}w`).join(', ');
