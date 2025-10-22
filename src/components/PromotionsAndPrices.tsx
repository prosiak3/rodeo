import { useState } from 'react';
import { TrendingDown, Percent } from 'lucide-react';
import PromotionsOverview from './PromotionsOverview';
import SpecialPricesManager from './SpecialPricesManager';

export default function PromotionsAndPrices() {
  const [subTab, setSubTab] = useState<'promotions' | 'prices'>('promotions');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setSubTab('promotions')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                subTab === 'promotions'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingDown className="w-5 h-5" />
              Promocje
            </button>
            <button
              onClick={() => setSubTab('prices')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                subTab === 'prices'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Percent className="w-5 h-5" />
              Ceny specjalne
            </button>
          </div>
        </div>

        <div className="p-6">
          {subTab === 'promotions' && <PromotionsOverview />}
          {subTab === 'prices' && <SpecialPricesManager />}
        </div>
      </div>
    </div>
  );
}
