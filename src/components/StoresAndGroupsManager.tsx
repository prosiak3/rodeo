/**
 * StoresAndGroupsManager - Zintegrowane zarządzanie sklepami i grupami
 *
 * Komponent łączący zarządzanie sklepami (StoresManager) i grupami sklepów (StoreGroupsManager)
 * w jednym interfejsie z pod-nawigacją.
 */

import { useState } from 'react';
import { ShoppingBag, Users, Map } from 'lucide-react';
import StoresManager from './StoresManager';
import StoreGroupsManager from './StoreGroupsManager';
import StoresMap from './StoresMap';

export default function StoresAndGroupsManager() {
  const [activeSubTab, setActiveSubTab] = useState<'stores' | 'groups' | 'map'>('stores');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveSubTab('stores')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition ${
            activeSubTab === 'stores'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Sklepy
        </button>
        <button
          onClick={() => setActiveSubTab('groups')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition ${
            activeSubTab === 'groups'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Grupy sklepów
        </button>
        <button
          onClick={() => setActiveSubTab('map')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition ${
            activeSubTab === 'map'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Map className="w-4 h-4" />
          Mapa
        </button>
      </div>

      <div>
        {activeSubTab === 'stores' && <StoresManager />}
        {activeSubTab === 'groups' && <StoreGroupsManager />}
        {activeSubTab === 'map' && <StoresMap />}
      </div>
    </div>
  );
}
