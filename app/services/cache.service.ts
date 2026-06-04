const cache = new Map();

export function getCache(key: string) {
  return cache.get(key);
}

export function setCache(key: string, value: any) {
  cache.set(key, value);
}