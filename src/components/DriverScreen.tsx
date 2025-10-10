import { useState, useEffect } from 'react';
import { Truck, Package, CheckCircle, MapPin, Clock, Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Delivery {
  id: string;
  order_id: string;
  loaded_at: string;
  delivered_at: string | null;
  status: 'loaded' | 'in_transit' | 'delivered';
  notes: string | null;
  order: {
    order_number: string;
    total_amount: number;
    store: {
      name: string;
      address: string;
      phone: string;
    };
  };
}

interface DriverScreenProps {
  userId: string;
}

export default function DriverScreen({ userId }: DriverScreenProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'loaded' | 'in_transit' | 'delivered'>('all');

  useEffect(() => {
    loadDeliveries();
  }, [userId]);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          order:order_id (
            order_number,
            total_amount,
            store:store_id (
              name,
              address,
              phone
            )
          )
        `)
        .eq('driver_id', userId)
        .order('loaded_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: 'in_transit' | 'delivered') => {
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', deliveryId);

      if (error) throw error;

      alert(newStatus === 'delivered' ? 'Dostawa oznaczona jako dostarczona!' : 'Ruszasz w trasę!');
      loadDeliveries();
    } catch (error) {
      console.error('Error updating delivery:', error);
      alert('Błąd podczas aktualizacji statusu');
    }
  };

  const filteredDeliveries = deliveries.filter(d => filter === 'all' || d.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loaded': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-amber-100 text-amber-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loaded': return <Package className="w-5 h-5" />;
      case 'in_transit': return <Truck className="w-5 h-5" />;
      case 'delivered': return <CheckCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'loaded': return 'Załadowano';
      case 'in_transit': return 'W drodze';
      case 'delivered': return 'Dostarczone';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <Truck className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Moje Dostawy</h1>
        </div>
        <p className="text-amber-100">Panel kierowcy</p>
      </div>

      <div className="p-4">
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              filter === 'all'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Wszystkie ({deliveries.length})
          </button>
          <button
            onClick={() => setFilter('loaded')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              filter === 'loaded'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Załadowane ({deliveries.filter(d => d.status === 'loaded').length})
          </button>
          <button
            onClick={() => setFilter('in_transit')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              filter === 'in_transit'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            W trasie ({deliveries.filter(d => d.status === 'in_transit').length})
          </button>
          <button
            onClick={() => setFilter('delivered')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              filter === 'delivered'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Dostarczone ({deliveries.filter(d => d.status === 'delivered').length})
          </button>
        </div>

        {filteredDeliveries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Brak dostaw</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        {delivery.order.order_number}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {delivery.order.total_amount.toFixed(2)} PLN
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(delivery.status)}`}>
                      {getStatusIcon(delivery.status)}
                      {getStatusText(delivery.status)}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{delivery.order.store.name}</p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.order.store.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          <Navigation className="w-4 h-4" />
                          {delivery.order.store.address}
                        </a>
                        {delivery.order.store.phone && (
                          <a
                            href={`tel:${delivery.order.store.phone}`}
                            className="text-sm text-green-600 hover:text-green-800 mt-1 block"
                          >
                            {delivery.order.store.phone}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Załadowano: {formatDate(delivery.loaded_at)}</span>
                    </div>

                    {delivery.delivered_at && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Dostarczone: {formatDate(delivery.delivered_at)}</span>
                      </div>
                    )}

                    {delivery.notes && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {delivery.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {delivery.status === 'loaded' && (
                      <button
                        onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}
                        className="flex-1 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition flex items-center justify-center gap-2"
                      >
                        <Truck className="w-5 h-5" />
                        Rozpocznij dostawę
                      </button>
                    )}
                    {delivery.status === 'in_transit' && (
                      <button
                        onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Oznacz jako dostarczone
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
