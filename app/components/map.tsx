"use client";
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoJsonLayer, ArcLayer } from "@deck.gl/layers";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Metadata } from 'next';
import proj4 from "proj4";

proj4.defs("EPSG:6668", "+proj=longlat +ellps=GRS80 +no_defs");
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

export const metadata: Metadata = {
  title: 'Example map.',
  description: 'Test for Mapbox in Deck.gl',
};

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function transformCoords(coords: any): any {
  if (Array.isArray(coords[0]) === false) {
    // Single coordinate pair
    return proj4("EPSG:6668", "EPSG:4326", coords);
  }
  return coords.map((c: any) => transformCoords(c));
}

export default function MapView() {   // add layers with type, and update that from chat. put into mapboxoverlay.
  const mapContainer = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!mapContainer.current) return;

    async function init() {
      // Fetch original GeoJSON (EPSG:6668)
      const raw = await fetch("/input.geojson").then(r => r.json());

      // Deep clone + reproject
      const data = JSON.parse(JSON.stringify(raw));
      data.features = data.features.map((f: any) => {
        f.geometry.coordinates = transformCoords(f.geometry.coordinates);
        return f;
      });

      // Initialize Mapbox
      const map = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/navigation-day-v1",
        center: [136.2236, 36.0641],
        zoom: 10,
        pitch: 30,
        localIdeographFontFamily: "'Noto Sans', 'Noto Sans CJK JP', sans-serif",
      });

      map.on("load", () => {
        map.setLanguage("ja-JP");

        // Add reprojected data to Mapbox
        map.addSource("test", {
          type: "geojson",
          data: data,
        });
      });

      // Deck.GL overlay
      const overlay = new MapboxOverlay({
        layers: [
          new GeoJsonLayer({
            id: "test-layer",
            data: data, 
            filled: true,
          }),
        ],
      });

      map.addControl(overlay);
      map.addControl(new mapboxgl.NavigationControl());
    }

    init();
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
      }}
    />
  );
}
