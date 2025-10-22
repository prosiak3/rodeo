/**
 * StoresMap - Mapa sklepów z wizualizacją lokalizacji według grup
 *
 * Wyświetla wszystkie sklepy na interaktywnej mapie Polski północno-wschodniej
 * z wykorzystaniem biblioteki Leaflet i OpenStreetMap.
 *
 * Funkcjonalności:
 * - Wizualizacja sklepów jako markery na mapie
 * - Kolory markerów zgodne z kolorami grup sklepów
 * - Popupy z informacjami o sklepie (nazwa, adres, grupa)
 * - Legenda pokazująca grupy i ich kolory
 * - Automatyczne centrowanie widoku na wszystkie sklepy
 *
 * Wykorzystuje:
 * - react-leaflet - komponenty React dla Leaflet
 * - leaflet - biblioteka map
 * - OpenStreetMap - darmowe kafelki map
 */

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';

interface Store {
  id: string;
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  group_id: string | null;
  group_name: string | null;
  group_color: string | null;
}

interface StoreGroup {
  id: string;
  name: string;
  color: string;
  store_count: number;
}

function MapBoundsHandler({ stores }: { stores: Store[] }) {
  const map = useMap();

  useEffect(() => {
    if (stores.length === 0) return;

    const validStores = stores.filter(s => s.latitude && s.longitude);
    if (validStores.length === 0) return;

    const bounds = L.latLngBounds(
      validStores.map(store => [store.latitude, store.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
  }, [stores, map]);

  return null;
}

export default function StoresMap() {
  const [stores, setStores] = useState<Store[]>([]);
  const [groups, setGroups] = useState<StoreGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Pobierz wszystkie sklepy
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name, code, address, latitude, longitude')
        .order('name');

      if (storesError) throw storesError;

      // Pobierz wszystkie członkostwa w grupach
      const { data: membershipsData } = await supabase
        .from('store_group_members')
        .select(`
          store_id,
          store_groups!inner (
            id,
            name,
            color
          )
        `);

      // Mapuj sklepy z informacjami o ich pierwszej grupie
      const storeGroupMap = new Map();
      (membershipsData || []).forEach((m: any) => {
        if (!storeGroupMap.has(m.store_id)) {
          storeGroupMap.set(m.store_id, {
            group_id: m.store_groups.id,
            group_name: m.store_groups.name,
            group_color: m.store_groups.color,
          });
        }
      });

      const mappedStores = (storesData || []).map((store: any) => {
        const groupInfo = storeGroupMap.get(store.id);
        return {
          id: store.id,
          name: store.name,
          code: store.code,
          address: store.address,
          latitude: store.latitude,
          longitude: store.longitude,
          group_id: groupInfo?.group_id || null,
          group_name: groupInfo?.group_name || null,
          group_color: groupInfo?.group_color || null,
        };
      });

      setStores(mappedStores);

      // Pobierz grupy z liczbą sklepów
      const { data: groupsData, error: groupsError } = await supabase
        .from('store_groups')
        .select(`
          id,
          name,
          color,
          stores (count)
        `)
        .eq('active', true)
        .order('name');

      if (groupsError) throw groupsError;

      const mappedGroups = (groupsData || []).map((group: any) => ({
        id: group.id,
        name: group.name,
        color: group.color,
        store_count: group.stores?.[0]?.count || 0,
      }));

      setGroups(mappedGroups);
    } catch (error) {
      console.error('Error loading stores map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCustomIcon = (color: string | null) => {
    const markerColor = color || '#6B7280'; // domyślnie szary dla sklepów bez grupy

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${markerColor};
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background-color: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const validStores = stores.filter(s => s.latitude && s.longitude);

  return (
    <div className="space-y-4">
      {/* Legenda grup */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Legenda grup sklepów:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {groups.map((group) => (
            <div key={group.id} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: group.color }}
              ></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{group.name}</p>
                <p className="text-xs text-gray-500">({group.store_count} sklepów)</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-white shadow bg-gray-500"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">Bez grupy</p>
              <p className="text-xs text-gray-500">
                ({stores.filter(s => !s.group_id).length} sklepów)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg border-2 border-gray-200">
        {validStores.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <p className="text-gray-600">Brak sklepów z lokalizacją GPS</p>
          </div>
        ) : (
          <MapContainer
            center={[52.0, 19.0]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <MapBoundsHandler stores={validStores} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {validStores.map((store) => (
              <Marker
                key={store.id}
                position={[store.latitude, store.longitude]}
                icon={createCustomIcon(store.group_color)}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{store.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{store.address}</p>
                    <p className="text-xs text-gray-500 mb-1">Kod: {store.code}</p>
                    {store.group_name ? (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                        <div
                          className="w-4 h-4 rounded-full border border-white shadow"
                          style={{ backgroundColor: store.group_color || '#6B7280' }}
                        ></div>
                        <p className="text-sm font-medium text-gray-700">{store.group_name}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">
                        Sklep nie należy do żadnej grupy
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Statystyki */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-amber-600">{stores.length}</p>
            <p className="text-sm text-gray-600">Wszystkie sklepy</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{validStores.length}</p>
            <p className="text-sm text-gray-600">Z lokalizacją GPS</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{groups.length}</p>
            <p className="text-sm text-gray-600">Aktywne grupy</p>
          </div>
        </div>
      </div>
    </div>
  );
}
