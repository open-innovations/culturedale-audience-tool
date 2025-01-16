import { result } from "./session-storage.ts";
import { colourScale } from "./colour.ts";
import { CAT_RESULT } from "./handlers-result.ts";
import { addPrefix } from "./utils.ts";

const calderdaleCentroid = [53.720501, -1.961800];

export async function initialiseMap() {
  const lsoaReq = await fetch(addPrefix("lookup/lsoa.geojson"));
  const geojsonData = await lsoaReq.json();
  const codes = geojsonData.features.map((x) => x.properties.LSOA21CD);

  const map = L.map("map", {
    scrollWheelZoom: false,
  }).setView(calderdaleCentroid, 10);

  // map.on('click', function() {
  //   const el: HTMLElement = map.getContainer();
  //   if (map.scrollWheelZoom.enabled()) {
  //     map.scrollWheelZoom.disable();
  //     el.classList.remove('mouse-active');
  //   } else {
  //     map.scrollWheelZoom.enable();
  //     el.classList.add('mouse-active');
  //   }
  // });

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    },
  ).addTo(map);

  const lsoaLayer = L.geoJSON(geojsonData);

  function handleData() {
    const data = Object.entries<number>(result.get())
      // Only interested in codes that are on the map
      .filter((x) => codes.includes(x[0]))
      .reduce((a, [k, v]) => ({ ...a, [k]: v }), {});

    const max = Math.max(...Object.values<number>(data));

    lsoaLayer.eachLayer((layer) => {
      const count = data[layer.feature.properties.LSOA21CD] || 0;
      const value = count / max;
      layer.feature.properties.count = count;
      layer.feature.properties.value = value;
    });

    lsoaLayer.setStyle((feature) => {
      const { value } = feature.properties;
      const color = colourScale(value).hex();
      return {
        weight: 0.5,
        color: "#fff",
        fillColor: color,
        fillOpacity: 0.8,
      };
    });
  }

  handleData();

  addEventListener(CAT_RESULT, handleData);

  lsoaLayer.addTo(map);

  lsoaLayer.bindTooltip(function (layer) {
    const { LSOA21CD, LSOA21NM, count } = layer.feature.properties;
    return `${LSOA21NM} (${LSOA21CD}) - ${count} attendees`;
  }, { sticky: true });

  function recentre() {
    map.flyToBounds(lsoaLayer.getBounds());
  }
  recentre();
}
