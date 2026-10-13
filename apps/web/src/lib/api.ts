export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/api/v1/${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errorJson = await response.json();
      errorMsg = errorJson.message || errorJson.error || errorMsg;
    } catch {
      // ignored
    }
    throw new Error(errorMsg);
  }

  // Handle empty responses or CSV export
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return (await response.text()) as unknown as T;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
