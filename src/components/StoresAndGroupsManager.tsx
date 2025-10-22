/**
 * StoresAndGroupsManager - Zintegrowane zarządzanie sklepami i grupami
 *
 * Komponent łączący zarządzanie sklepami (StoresManager) i grupami sklepów (StoreGroupsManager)
 * w jednym interfejsie z pod-nawigacją.
 */

import { useState } from 'react';
import { ShoppingBag, Users } from 'lucide-react';
import StoresManager from './StoresManager';
import StoreGroupsManager from './StoreGroupsManager';

export default function StoresAndGroupsManager() {
  const [activeSubTab, setActiveSubTab] = useState<'stores' | 'groups'>('stores');

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
      </div>

      <div>
        {activeSubTab === 'stores' && <StoresManager />}
        {activeSubTab === 'groups' && <StoreGroupsManager />}
      </div>
    </div>
  );
}
