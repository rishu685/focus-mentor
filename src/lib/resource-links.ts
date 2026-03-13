const EXTERNAL_URL_PROTOCOLS = new Set(['http:', 'https:']);

function hasDomainShape(value: string) {
  return /^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(value);
}

export function normalizeExternalUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue || trimmedValue === '#') {
    return null;
  }

  if (/^(?:javascript|data|vbscript):/i.test(trimmedValue)) {
    return null;
  }

  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmedValue)
    ? trimmedValue
    : hasDomainShape(trimmedValue)
      ? `https://${trimmedValue}`
      : trimmedValue;

  try {
    const parsedUrl = new URL(candidate);
    return EXTERNAL_URL_PROTOCOLS.has(parsedUrl.protocol) ? parsedUrl.toString() : null;
  } catch {
    return null;
  }
}

export interface ResourceLike {
  title?: string;
  description?: string;
  url?: string;
  link?: string;
  format?: string;
  type?: string;
  benefits?: string[];
  relevanceScore?: number;
  syllabusAlignment?: string;
}

export function mapResourceForClient(resource: ResourceLike) {
  return {
    title: resource.title || 'Untitled Resource',
    description: resource.description || 'No description available.',
    url: normalizeExternalUrl(resource.url || resource.link),
    format: resource.format || resource.type || 'Resource',
    benefits: Array.isArray(resource.benefits) ? resource.benefits : [],
    relevanceScore: resource.relevanceScore,
    syllabusAlignment: resource.syllabusAlignment,
  };
}