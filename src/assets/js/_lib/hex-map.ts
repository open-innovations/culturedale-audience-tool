import { HexMap } from "https://cdn.jsdelivr.net/gh/dringtech/web-building-blocks@main/visualisation/hex-map.ts";

import { CAT_RESULT } from "./handlers-result.ts";
import { colourScale } from "./colour.ts";

customElements.define("hex-map", HexMap);

export function initialiseHexMap() {
  const hexMap = document.querySelector<HexMap>("hex-map");
  if (!hexMap) return;

  // Define label function
  hexMap.labelSpec = (c) => c.sn as string;

  // Setup title render function
  hexMap.titleSpec = (c) => `${c.n}: ${c.count} attendees`;

  // Setup style render function
  hexMap.styleSpec = (c) => ({
    fill: colourScale(c.value).hex(),
  });

  addEventListener(CAT_RESULT, function (evt: CustomEvent) {
    // Only interested in wards
    const data = Object.entries<number>(evt.detail)
      .filter((x) => x[0].startsWith("E05"));

    // Find the largest value
    const max = Math.max(...data.map((x) => x[1]));

    // Update the hex map
    hexMap.data = data.reduce((a, [k, v]) => ({
      ...a,
      [k]: {
        count: v,
        value: v / max,
      },
    }), {});
  });
}
