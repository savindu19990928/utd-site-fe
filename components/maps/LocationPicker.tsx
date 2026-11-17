"use client";

import React, { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";

interface LocationPickerProps {
  value: string;
  onChange: (val: string) => void;
  heightClass?: string;
  readOnly?: boolean;
  initialLat?: number;
  initialLng?: number;
}

function parseCoordsFromValue(val: string): [number, number] | null {
  if (!val) return null;
  const direct = val.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (direct) {
    return [parseFloat(direct[1]), parseFloat(direct[2])];
  }
  const urlMatch = val.match(/@(-?\d+\.\d+),(-?\d+\.\d+)|[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (urlMatch) {
    const lat = parseFloat(urlMatch[1] || urlMatch[3]);
    const lng = parseFloat(urlMatch[2] || urlMatch[4]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  }
  return null;
}

export function LocationPicker({
  value,
  onChange,
  heightClass = "h-56",
  readOnly = false,
  initialLat = 6.9271,
  initialLng = 79.8612,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").CircleMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let mounted = true;
    const coords = parseCoordsFromValue(initialValueRef.current) ?? [initialLat, initialLng];

    import("leaflet").then((L) => {
      if (!mounted || !mapContainerRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView(coords, 14);
        if (markerRef.current) {
          markerRef.current.setLatLng(coords);
        }
        return;
      }

      const map = L.map(mapContainerRef.current, {
        center: coords,
        zoom: 13,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.circleMarker(coords, {
        radius: 10,
        fillColor: "#F5A623",
        color: "#0F172A",
        weight: 3,
        opacity: 1,
        fillOpacity: 0.95,
      }).addTo(map);

      if (!readOnly) {
        map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          onChangeRef.current(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;
    });

    return () => {
      mounted = false;
    };
  }, [initialLat, initialLng, readOnly]);

  useEffect(() => {
    const coords = parseCoordsFromValue(value);
    if (coords && mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng(coords);
      mapInstanceRef.current.panTo(coords);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleUseMyLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        onChange(`${lat}, ${lng}`);
        setLocating(false);
      },
      () => {
        setGeoError("Unable to retrieve current GPS location. Click on the map to drop a pin manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-2.5">
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <MapPin className="h-3.5 w-3.5 text-[#EA580C]" />
            Click anywhere on the map to pin exact job-site entrance
          </span>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-60"
          >
            <LocateFixed className="h-3.5 w-3.5" />
            {locating ? "Locating..." : "Use My Current Location"}
          </button>
        </div>
      )}

      {geoError && (
        <p className="text-xs text-red-600">{geoError}</p>
      )}

      <div
        ref={mapContainerRef}
        className={`${heightClass} w-full rounded-xl border border-slate-300 bg-slate-100 z-0 overflow-hidden`}
      />
    </div>
  );
}
