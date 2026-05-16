function encodePathValue(value: string) {
  return encodeURIComponent(value);
}

function buildQuery(params: Record<string, string | undefined>) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`)
    .join('&');

  return query ? `?${query}` : '';
}

export const ranklandRoutes = {
  home: {
    path: '/',
    ssr: true,
    build: () => '/',
  },
  search: {
    path: '/search',
    ssr: true,
    build: (opts: { kw?: string } = {}) => `/search${buildQuery({ kw: opts.kw })}`,
  },
  ranklist: {
    path: '/ranklist/:id',
    ssr: true,
    build: (opts: { id: string }) => `/ranklist/${encodePathValue(opts.id)}`,
  },
  collection: {
    path: '/collection/:id',
    ssr: true,
    build: (opts: { id: string; rankId?: string }) =>
      `/collection/${encodePathValue(opts.id)}${buildQuery({ rankId: opts.rankId })}`,
  },
  live: {
    path: '/live/:id',
    ssr: false,
    build: (opts: { id: string }) => `/live/${encodePathValue(opts.id)}`,
  },
  playground: {
    path: '/playground',
    ssr: false,
    build: () => '/playground',
  },
} as const;
