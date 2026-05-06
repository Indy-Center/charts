// source: community-website/website/src/lib/config/index.ts
// Mirrored as a static list because community-website doesn't expose it as
// a shared package or HTTP endpoint. Update both lists if either changes.
export const COMMON_AIRPORTS: readonly string[] = [
  'KCMH',
  'KCRW',
  'KCVG',
  'KDAY',
  'KEVV',
  'KHTS',
  'KHUF',
  'KIND',
  'KLEX',
  'KPKB',
  'KSDF'
] as const;
