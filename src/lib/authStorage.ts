const CURRENT_PROJECT_REF = 'zupjsghppxyvmgwxvycc';
const STALE_PROJECT_REFS = ['viidccjyjeipulbqqwua'];
const AUTH_KEY_PATTERNS = ['supabase.auth', 'sb-', CURRENT_PROJECT_REF];

function collectMatchingStorageKeys(storage: Storage, patterns: string[]) {
  const keysToRemove: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && patterns.some((pattern) => key.includes(pattern))) {
      keysToRemove.push(key);
    }
  }

  return keysToRemove;
}

function clearStorageKeys(storage: Storage, patterns: string[]) {
  const keysToRemove = collectMatchingStorageKeys(storage, patterns);
  keysToRemove.forEach((key) => storage.removeItem(key));
  return keysToRemove.length;
}

/**
 * Remove auth keys left behind by the old Supabase project so they
 * can never conflict with the current project's JWT verification.
 * Safe to call on every app boot — it only touches stale keys.
 */
export function clearStaleAuthCache() {
  const stalePatterns = STALE_PROJECT_REFS.map((ref) => `sb-${ref}`);
  clearStorageKeys(localStorage, stalePatterns);
  clearStorageKeys(sessionStorage, stalePatterns);
}

export function clearAllAuthCache() {
  clearStorageKeys(localStorage, AUTH_KEY_PATTERNS);
  clearStorageKeys(sessionStorage, AUTH_KEY_PATTERNS);
}
