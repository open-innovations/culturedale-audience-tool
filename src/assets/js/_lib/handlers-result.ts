import { postcodeLookup } from "./postcode-lookup.ts";
import {
  errors as errorStore,
  input,
  result as resultStore,
} from "./session-storage.ts";

export const CAT_INPUT = "cat-input";
export const CAT_RESULT = "cat-result";
export const CAT_ERRORS = "cat-errors";

export async function queryHandler() {
  // Load data from Session storage
  const data = input.get();

  // TODO redirect to error page if no data provided

  // Dispatch event if data loads
  const inputEvent = new CustomEvent(CAT_INPUT, { detail: data });
  dispatchEvent(inputEvent);

  // Process the input into a result array
  const result: [string, number][] = [];
  const errors: string[] = [];

  for (const [postcode, count] of Object.entries<number>(data)) {
    try {
      const geos = await postcodeLookup.lookupOne(postcode);
      for (const geo of geos) {
        result.push([geo, count]);
      }
    } catch (e) {
      errors.push(postcode);
    }
  }
  errorStore.set(errors);
  const errorEvent = new CustomEvent(CAT_ERRORS);
  dispatchEvent(errorEvent);

  // Summarise array into object
  const summary = result.reduce<Record<string, number>>((a, [geo, count]) => ({
    ...a,
    [geo]: (a[geo] || 0) + count,
  }), {});

  resultStore.set(summary);

  // TODO move event dispatch to resultStore?
  // Create and dispatch event
  const resultEvent = new CustomEvent(CAT_RESULT, { detail: summary });
  dispatchEvent(resultEvent);
}
