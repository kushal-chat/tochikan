"use client";

import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoJsonLayer } from "@deck.gl/layers";
import "maplibre-gl/dist/maplibre-gl.css";
import proj4 from "proj4";

// --- Projections ---
proj4.defs("EPSG:6668", "+proj=longlat +ellps=GRS80 +no_defs");
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

type Coordinate = [number, number];
type CoordinateArray = Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][];

function transformCoords(coords: CoordinateArray): CoordinateArray {
  if (!Array.isArray(coords[0])) {
    return proj4("EPSG:6668", "EPSG:4326", coords as Coordinate) as Coordinate;
  }
  return coords.map((c) => transformCoords(c as CoordinateArray)) as Coordinate[];
}
export default function MapView() {

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {

    async function init() {
      if (!containerRef.current) return;
      
      // Load original EPSG:6668 GeoJSON
      const raw = await fetch("/input.geojson").then((r) => r.json());

      const data = JSON.parse(JSON.stringify(raw));
      data.features = data.features.map((f: any) => {
        f.geometry.coordinates = transformCoords(f.geometry.coordinates);
        return f;
      });

      // ---- Initialize MapLibre ----
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: "https://tile.openstreetmap.jp/styles/osm-bright/style.json",
        center: [136.2236, 36.0641],
        zoom: 10,
        pitch: 30,
      });

      map.on("load", () => {
        // Add reprojected GeoJSON
        map.addSource("test", {
          type: "geojson",
          data,
        });
      });

      // ---- Deck.gl overlay ----
      const overlay = new MapboxOverlay({
        interleaved: true,
        layers: [
          new GeoJsonLayer({
            id: "test-layer",
            data,
            filled: true,
            getFillColor: [30, 100, 220, 150],
            pickable: true,
          }),
        ],
      });

      map.addControl(overlay);
      map.addControl(new maplibregl.NavigationControl());
    }

    init();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        width: "100vw",
        height: "100vh",
        inset: 0,
      }}
    />
  );
}
