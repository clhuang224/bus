export function normalizeRouteSearchText(value: string) {
  return value
    .normalize('NFKC')
    .replace(/\u3000/g, ' ')
    .replace(/[‐‑‒–—―－]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[\s-]+/g, '')
    .trim()
    .toLowerCase()
}
