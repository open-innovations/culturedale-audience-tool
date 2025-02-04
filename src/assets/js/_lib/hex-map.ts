import { CAT_RESULT } from "./handlers-result.ts";
import { colourScale } from "./colour.ts";

// Return the most contrasty colour
// https://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
// https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html#contrast-ratiodef
function d2h(d){ return ((d < 16) ? "0" : "") + d.toString(16); }
function h2d(h){ return parseInt(h, 16); }
function toLin(v){ v /= 255; if (v <= 0.03928){ return v/12.92; }else{ return Math.pow((v+0.055)/1.055,2.4); }}
function rLum(rgb){ return 0.2126 * toLin(rgb[0]) + 0.7152 * toLin(rgb[1]) + 0.0722 * toLin(rgb[2]); }
function contrastRatio(a, b){ let L1 = rLum(a); let L2 = rLum(b); if(L1 < L2){ let temp = L2; L2 = L1; L1 = temp; } return (L1 + 0.05) / (L2 + 0.05); }
function contrastColour(c){ let rgb = [h2d(c.substring(1,3)),h2d(c.substring(3,5)),h2d(c.substring(5,7))]; return (contrastRatio(rgb,[0, 0, 0]) > contrastRatio(rgb,[255, 255, 255]) ? "black" : "white"); }

export function initialiseHexMap() {

	// Get the hexes and build a lookup to access their properties quickly
	var hexes = document.querySelectorAll('.oi-map-map[data-type=hex-map] .hex');
	var lookup = {},id,val,colour;
	for(let i = 0; i < hexes.length; i++){
		id = hexes[i].getAttribute('data-id');
		lookup[id] = {
			'g':hexes[i],
			'path':hexes[i].querySelector('path'),
			'title':hexes[i].querySelector('path title'),
			'name':hexes[i].querySelector('path title').innerHTML,
			'label':hexes[i].querySelector('text')
		};
		lookup[id].path.setAttribute('fill','#dfdfdf');
	}


	addEventListener(CAT_RESULT, function (evt: CustomEvent) {
		// Only interested in wards
		const data = Object.entries<number>(evt.detail)
		  .filter((x) => x[0].startsWith("E05"));

		// Find the largest value
		const max = Math.max(...data.map((x) => x[1]));

		// Reset values
		for(var id in lookup) lookup[id].value = 0;

		// Add data values to lookup
		for(var i = 0; i < data.length; i++){
			id = data[i][0];
			val = data[i][1];
			if(lookup[id]) lookup[id].value = val;
		}

		// Loop over all hexagons and set them
		for(var id in lookup){
			val = lookup[id].value;
			colour = colourScale(val/max).hex();
			lookup[id].path.setAttribute('fill',colour);
			lookup[id].label.setAttribute('fill',contrastColour(colour));
			lookup[id].title.innerHTML = lookup[id].name+'<br />Total: <strong>'+val.toLocaleString()+'</strong>';
		}
	});
}
