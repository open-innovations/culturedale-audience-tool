import { TieredCache } from "https://cdn.jsdelivr.net/gh/dringtech/web-building-blocks@main/lookup/tiered-cache.ts";
import { addPrefix } from "./utils.ts";

type PostcodeLookupResult = string[];

export function normalisePostcode(postcode: string) {
  return postcode.toUpperCase().replace(/\s+/g, "").replace(
    /^(.*?)\s*(\d[A-Z]{2})$/i,
    "$1 $2",
  );
}

// Convert a string into an array of strings for each level
const splitter = (k: string) => k.trim().split(/\s+/);

// Function to load a new file
const loader = async (key: string) => {
  // TODO error handling
  const town = key.match(/^[^\d]+/)![0];
  // TODO deal with site path prefix
  const req = await fetch(addPrefix(`lookup/${town}.json`));
  if (req.status != 200) {
    return {};
  }
  return req.json();
};

export const postcodeLookup = new TieredCache<PostcodeLookupResult>({
  splitter,
  loader,
});
