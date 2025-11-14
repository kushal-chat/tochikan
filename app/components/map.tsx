"use client";
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoJsonLayer, ArcLayer } from "@deck.gl/layers";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Example map.',
  description: 'Test for Mapbox in Deck.gl',
};

const AIR_PORTS =
  "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson";


mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapView() {   // add layers with type, and update that from chat. put into mapboxoverlay.
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize Mapbox
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/navigation-day-v1",
      center: [0.45, 51.47],
      localIdeographFontFamily: "'Times New Roman'",
      zoom: 3,
      pitch: 30,
    });

    // Create Deck.GL overlay
    const overlay = new MapboxOverlay({
      layers: [
        new GeoJsonLayer({
          id: "airports",
          data: AIR_PORTS,
          filled: true,
          pointRadiusMinPixels: 2,
          pointRadiusScale: 2000,
          getPointRadius: (f) => 11 - f.properties.scalerank,
          getFillColor: [200, 0, 80, 180],
          pickable: true,
          autoHighlight: true,
          onClick: (info) => {
            if (info.object)
              alert(`${info.object.properties.name} (${info.object.properties.abbrev})`);
          },
        }),
        new ArcLayer({
          id: "arcs",
          data: AIR_PORTS,
          dataTransform: (d) => d.features.filter((f) => f.properties.scalerank < 4),
          getSourcePosition: () => [36.2048, 138.2529], // London
          getTargetPosition: (f) => f.geometry.coordinates,
          getSourceColor: [0, 128, 200],
          getTargetColor: [200, 0, 80],
          getWidth: 1,
        }),
      ],
    });

    map.addControl(overlay);
    map.addControl(new mapboxgl.NavigationControl());

    return () => map.remove();
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "120vw",
        height: "100vh",
      }}
    />
  );
}
