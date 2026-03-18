// Minimal auth redirect helpers (OAuth removed)

export function hasAuthCallbackParams() {
  const url = new URL(window.location.href);
  return url.searchParams.has('token_hash') || url.searchParams.has('type');
}

export function clearAuthCallbackParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete('token_hash');
  url.searchParams.delete('type');
  url.searchParams.delete('token');
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
}
