import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface StoreLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface StoresMapProps {
  stores: StoreLocation[];
  selectedStoreId: string;
  onStoreSelect: (storeId: string) => void;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function StoresMap({ stores, selectedStoreId, onStoreSelect }: StoresMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([52.0, 19.0]);
  const [mapZoom, setMapZoom] = useState(6);

  useEffect(() => {
    const selectedStore = stores.find(s => s.id === selectedStoreId);
    if (selectedStore && selectedStore.latitude && selectedStore.longitude) {
      setMapCenter([selectedStore.latitude, selectedStore.longitude]);
      setMapZoom(12);
    } else {
      setMapCenter([52.0, 19.0]);
      setMapZoom(6);
    }
  }, [selectedStoreId, stores]);

  const createCustomIcon = (isSelected: boolean) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${isSelected ? '#f59e0b' : '#3b82f6'};
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

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg border-2 border-gray-200">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stores.map((store) => {
          if (!store.latitude || !store.longitude) return null;

          const isSelected = store.id === selectedStoreId;

          return (
            <Marker
              key={store.id}
              position={[store.latitude, store.longitude]}
              icon={createCustomIcon(isSelected)}
              eventHandlers={{
                click: () => {
                  onStoreSelect(store.id);
                },
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{store.name}</h3>
                  <p className="text-sm text-gray-600">{store.address}</p>
                  <button
                    onClick={() => onStoreSelect(store.id)}
                    className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Zobacz analizę
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
