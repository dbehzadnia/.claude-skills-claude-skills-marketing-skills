export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export function normalizePage(page?: number | string | null, pageSize?: number | string | null) {
  const p = Math.max(1, Math.floor(Number(page) || 1));
  const s = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(pageSize) || DEFAULT_PAGE_SIZE)));
  return { page: p, pageSize: s, skip: (p - 1) * s, take: s };
}

export function paged<T>(items: T[], total: number, page: number, pageSize: number): Paged<T> {
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}
