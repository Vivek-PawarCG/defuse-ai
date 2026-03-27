// In-memory cache for stateless backend (warm containers)
const cache = new Map();
const MAX_CACHE_SIZE = 50;

export function getCachedResponse(key) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  return null;
}

export function setCachedResponse(key, value) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, value);
}

export function generateCacheKey(contents) {
  // Use the last user message as the primary key
  const lastMsg = contents[contents.length - 1];
  return JSON.stringify(lastMsg.parts);
}
