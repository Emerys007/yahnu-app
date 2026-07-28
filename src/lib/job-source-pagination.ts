export class JobSourcePaginationError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.name = 'JobSourcePaginationError';
    this.code = code;
  }
}

type SourcePage<T> = {
  items: T[];
  sourceItemCount: number;
};

/**
 * Collects a complete, bounded offset-paginated source. A final short page is
 * required; reaching the hard source bound on a full page fails closed so a
 * partial feed can never be mistaken for a complete one during expiry.
 */
export async function collectCompleteSourcePages<T>(
  loadPage: (offset: number, pageSize: number) => Promise<SourcePage<T>>,
  options: { pageSize: number; maxSourceItems: number },
) {
  const { pageSize, maxSourceItems } = options;
  if (!Number.isInteger(pageSize) || pageSize < 1 || !Number.isInteger(maxSourceItems) || maxSourceItems < pageSize) {
    throw new JobSourcePaginationError('invalid_pagination_bounds');
  }

  const collected: T[] = [];
  let offset = 0;
  while (offset < maxSourceItems) {
    const page = await loadPage(offset, pageSize);
    if (
      !Number.isInteger(page.sourceItemCount)
      || page.sourceItemCount < 0
      || page.sourceItemCount > pageSize
    ) {
      throw new JobSourcePaginationError('invalid_page_size');
    }

    collected.push(...page.items);
    if (page.sourceItemCount < pageSize) return collected;

    offset += page.sourceItemCount;
    if (offset >= maxSourceItems) {
      throw new JobSourcePaginationError('source_truncated');
    }
  }

  throw new JobSourcePaginationError('source_truncated');
}
