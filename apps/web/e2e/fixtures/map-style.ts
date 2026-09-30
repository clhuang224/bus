import type { StyleSpecification } from 'maplibre-gl'

export const mapStyle = {
  version: 8,
  sources: {
    'test-tiles': {
      type: 'vector',
      tiles: ['https://tiles.openfreemap.org/test/{z}/{x}/{y}.pbf'],
      minzoom: 0,
      maxzoom: 14,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#ffffff' },
    },
    {
      id: 'test-land',
      type: 'fill',
      source: 'test-tiles',
      'source-layer': 'land',
      paint: { 'fill-color': '#16a34a' },
    },
  ],
} satisfies StyleSpecification
