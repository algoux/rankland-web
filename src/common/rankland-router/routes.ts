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
    ssr: false,
    build: (opts: { kw?: string } = {}) => `/search${buildQuery({ kw: opts.kw })}`,
  },
  ranklist: {
    path: '/ranklist/:id',
    ssr: true,
    build: (opts: { id: string; focus?: string }) => `/ranklist/${encodePathValue(opts.id)}${buildQuery({ focus: opts.focus })}`,
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
    build: (opts: { id: string; token?: string; scrollSolution?: string; focus?: string }) =>
      `/live/${encodePathValue(opts.id)}${buildQuery({
        token: opts.token,
        scrollSolution: opts.scrollSolution,
        focus: opts.focus,
      })}`,
  },
  playground: {
    path: '/playground',
    ssr: false,
    build: () => '/playground',
  },
} as const;
