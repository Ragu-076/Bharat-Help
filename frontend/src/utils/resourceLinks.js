// Only link explicit website addresses; organisation names stay plain text.
export function websiteUrl(value) {
  const match = value.match(/(?:https?:\/\/)?(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s]*)?/i);
  if (!match) return null;
  const candidate = match[0].replace(/[.,;:)]+$/, '');
  const url = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
  return url.href;
}

export function contactLinks(value) {
  const url = websiteUrl(value);
  if (url) return [{ label: value, href: url, external: true }];
  return value.split('/').map((part) => part.trim()).map((label) => ({
    label,
    href: /^[+\d\s()-]+$/.test(label) ? `tel:${label.replace(/[^+\d]/g, '')}` : null,
    external: false,
  }));
}
