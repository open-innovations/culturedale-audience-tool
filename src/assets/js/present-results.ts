import {
  CAT_ERRORS,
  CAT_INPUT,
  CAT_RESULT,
  queryHandler,
} from "./_lib/handlers-result.ts";
import { CodeLookup } from "https://cdn.jsdelivr.net/gh/dringtech/web-building-blocks@main/lookup/code-lookup.ts";
import { initialiseHexMap } from "./_lib/hex-map.ts";
import { initialiseMap } from "./_lib/leaflet-map.ts";
import { addPrefix } from "./_lib/utils.ts";
import { errors } from "./_lib/session-storage.ts";

const result = document.querySelector("#result");

// Add handler for download link
function downloadInputHandler(event: CustomEvent) {
  const downloadInput = document.querySelector<HTMLAnchorElement>(
    "#download-input",
  );
  if (!downloadInput) return;
  const fileContent = Object.entries(event.detail).map((r) => r.join(",")).join(
    "\n",
  );
  const dataUri = `data:text/csv;base64,${btoa(fileContent)}`;
  downloadInput.href = dataUri;
}

addEventListener(CAT_INPUT, downloadInputHandler);

// Add handler for results link
function downloadResultHandler(event: CustomEvent) {
  const downloadResult = document.querySelector<HTMLAnchorElement>(
    "#download-result",
  );
  if (!downloadResult) return;
  const fileContent = Object.entries(event.detail).map((r) => r.join(",")).join(
    "\n",
  );
  const dataUri = `data:text/csv;base64,${btoa(fileContent)}`;
  downloadResult.href = dataUri;
}

addEventListener(CAT_RESULT, downloadResultHandler);

// Add handler to display output
const codeLookup = new CodeLookup();

async function resultHandler(evt: CustomEvent) {
  // TODO deal with base path issues
  await codeLookup.load([
    addPrefix("lookup/wards.json"),
    addPrefix("lookup/lads.json"),
    addPrefix("lookup/lsoa.json"),
  ]);
  if (!result) return;

  const augmented = Object.entries(evt.detail)
    .reduce((summ, [code, count]) => ({
      ...summ,
      [code]: {
        code,
        // Get the codes, which are English then (optional) Welsh names.
        // Reverse reverse this list, then filter only the set values
        // Take the first value.
        // This will get the English version, unless the Welsh is set.
        name: codeLookup.get(code).toReversed().filter((x) => x)[0] ||
          undefined,
        count,
      },
    }), {});

  result.innerHTML = JSON.stringify(augmented, null, 2);
}

addEventListener(CAT_RESULT, resultHandler);

addEventListener("DOMContentLoaded", initialiseMap);

addEventListener("DOMContentLoaded", initialiseHexMap);

document.addEventListener("DOMContentLoaded", queryHandler);

addEventListener(CAT_ERRORS, () => {
  const errorList = errors.get();
  const errorEl = document.querySelector<HTMLElement>("[data-comp=errors]");
  errorEl.dataset.errorCount = `${errorList.length}`;
  const errorListEl = errorEl?.querySelector("div");
  errorListEl.innerHTML = errorList.join("\n");
});
