import { normalisePostcode } from "./postcode-lookup.ts";
import { errors, input, raw, result } from "./session-storage.ts";

export const POSTCODE_QUERY = "postcode-query";
export const CAT_RAW = "cat-raw";

export function readState() {
  const data = raw.get();
  dispatchEvent(new CustomEvent(CAT_RAW, { detail: data }));
}

export function inputHandler(this: HTMLFormElement) {
  raw.set(this.postcodes.value);
}

export function submitHandler(this: HTMLFormElement) {
  // event.preventDefault();
  input.set(mapPostcodes(this.postcodes.value));
  this.postcodes.setAttribute("disabled", "disabled");
}

export function resetHandler(this: HTMLFormElement) {
  this.postcodes.value = "";
  raw.clear();
  input.clear();
  result.clear();
  errors.clear();
}

function mapPostcodes(input: string) {
  // Convert the input to an object with postcodes as keys and a count of entries
  return input
    // Split on newlines
    .split(/\n/)
    // Remove leading / trailing whitespace
    .map((s) => s.trim())
    // Remove any empty lines
    .filter((s) => s)
    // Split on comma
    .map((s) => s.split(/\s*,\s*/))
    // Convert postcode and count
    .map<[string, number]>((
      [postcode, count],
    ) => [normalisePostcode(postcode), parseInt(count) || 1])
    // Convert to an object
    .reduce<{ [code: string]: number }>(
      (a, [code, count]) => ({ ...a, [code]: (a[code] || 0) + count }),
      {},
    );
}
