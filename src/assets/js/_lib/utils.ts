export const addPrefix = (path: string) =>
  (globalThis.PREFIX || "/") + path.replace(/^\/+/, "");
