import { useState, useEffect } from 'react';
import { Clock, User, FileText, DollarSign, Store, Users, X, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PriceListChange {
  id: string;
  change_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  created_at: string;
  changed_by: string | null;
  user_name: string | null;
  user_email: string | null;
}

interface PriceListItemChange {
  id: string;
  change_type: string;
  old_price: number | null;
  new_price: number | null;
  created_at: string;
  changed_by: string | null;
  user_name: string | null;
  product_name: string;
  product_code: string;
}

interface AssignmentHistory {
  id: string;
  action: string;
  priority: string;
  valid_from: string;
  valid_to: string | null;
  created_at: string;
  assigned_by: string | null;
  user_name: string | null;
  store_name: string | null;
  store_code: string | null;
  group_name: string | null;
}

interface PriceListHistoryProps {
  priceListId: string;
  priceListName: string;
  onClose: () => void;
}

export default function PriceListHistory({ priceListId, priceListName, onClose }: PriceListHistoryProps) {
  const [changes, setChanges] = useState<PriceListChange[]>([]);
  const [itemChanges, setItemChanges] = useState<PriceListItemChange[]>([]);
  const [assignments, setAssignments] = useState<AssignmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'changes' | 'items' | 'assignments'>('changes');

  useEffect(() => {
    loadHistory();
  }, [priceListId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const [changesRes, itemChangesRes, assignmentsRes] = await Promise.all([
        supabase
          .from('price_list_changes_log')
          .select(`
            id,
            change_type,
            field_name,
            old_value,
            new_value,
            description,
            created_at,
            changed_by,
            users:changed_by (
              name,
              email
            )
          `)
          .eq('price_list_id', priceListId)
          .order('created_at', { ascending: false }),

        supabase
          .from('price_list_item_changes_log')
          .select(`
            id,
            change_type,
            old_price,
            new_price,
            created_at,
            changed_by,
            users:changed_by (
              name,
              email
            ),
            products (
              name,
              code
            )
          `)
          .eq('price_list_id', priceListId)
          .order('created_at', { ascending: false }),

        supabase
          .from('price_list_assignment_history')
          .select(`
            id,
            action,
            priority,
            valid_from,
            valid_to,
            created_at,
            assigned_by,
            users:assigned_by (
              name,
              email
            ),
            stores (
              name,
              code
            ),
            store_groups (
              name
            )
          `)
          .eq('price_list_id', priceListId)
          .order('created_at', { ascending: false }),
      ]);

      if (changesRes.error) throw changesRes.error;
      if (itemChangesRes.error) throw itemChangesRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;

      setChanges(
        (changesRes.data || []).map((item: any) => ({
          ...item,
          user_name: item.users?.name || null,
          user_email: item.users?.email || null,
        }))
      );

      setItemChanges(
        (itemChangesRes.data || []).map((item: any) => ({
          ...item,
          user_name: item.users?.name || null,
          product_name: item.products?.name || 'Nieznany produkt',
          product_code: item.products?.code || '',
        }))
      );

      setAssignments(
        (assignmentsRes.data || []).map((item: any) => ({
          ...item,
          user_name: item.users?.name || null,
          store_name: item.stores?.name || null,
          store_code: item.stores?.code || null,
          group_name: item.store_groups?.name || null,
        }))
      );
    } catch (error) {
      console.error('Error loading history:', error);
      alert('Błąd podczas wczytywania historii');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChangeTypeLabel = (changeType: string) => {
    const labels: Record<string, string> = {
      created: 'Utworzono',
      updated: 'Zaktualizowano',
      activated: 'Aktywowano',
      deactivated: 'Dezaktywowano',
      deleted: 'Usunięto',
      name_changed: 'Zmiana nazwy',
      dates_changed: 'Zmiana dat',
      price_updated: 'Zmiana ceny',
      assigned: 'Przypisano',
      unassigned: 'Cofnięto przypisanie',
    };
    return labels[changeType] || changeType;
  };

  const getChangeTypeColor = (changeType: string) => {
    const colors: Record<string, string> = {
      created: 'bg-green-100 text-green-800',
      updated: 'bg-blue-100 text-blue-800',
      activated: 'bg-green-100 text-green-800',
      deactivated: 'bg-gray-100 text-gray-800',
      deleted: 'bg-red-100 text-red-800',
      name_changed: 'bg-blue-100 text-blue-800',
      dates_changed: 'bg-purple-100 text-purple-800',
      price_updated: 'bg-amber-100 text-amber-800',
      assigned: 'bg-green-100 text-green-800',
      unassigned: 'bg-red-100 text-red-800',
    };
    return colors[changeType] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrator',
      warehouse: 'Magazyn',
      salesperson: 'Handlowiec',
    };
    return labels[priority] || priority;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-amber-600" />
          <div>
            <h3 className="text-xl font-bold text-gray-800">Historia cennika</h3>
            <p className="text-sm text-gray-600">{priceListName}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('changes')}
            className={`flex-1 px-6 py-4 font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'changes'
                ? 'bg-amber-50 text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5" />
            Zmiany w cenniku ({changes.length})
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`flex-1 px-6 py-4 font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'items'
                ? 'bg-amber-50 text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Zmiany cen ({itemChanges.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 px-6 py-4 font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'assignments'
                ? 'bg-amber-50 text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Store className="w-5 h-5" />
            Przypisania ({assignments.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'changes' && (
            <div className="space-y-3">
              {changes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Brak zmian w historii</p>
                </div>
              ) : (
                changes.map((change) => (
                  <div
                    key={change.id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(
                              change.change_type
                            )}`}
                          >
                            {getChangeTypeLabel(change.change_type)}
                          </span>
                          {change.field_name && (
                            <span className="text-xs text-gray-500">
                              Pole: {change.field_name}
                            </span>
                          )}
                        </div>

                        {change.description && (
                          <p className="text-sm text-gray-700 mb-2">{change.description}</p>
                        )}

                        {change.old_value && change.new_value && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-red-600 line-through">{change.old_value}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-green-600 font-medium">{change.new_value}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(change.created_at)}
                          </div>
                          {change.user_name && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {change.user_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-3">
              {itemChanges.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Brak zmian cen w historii</p>
                </div>
              ) : (
                itemChanges.map((change) => (
                  <div
                    key={change.id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(
                              change.change_type
                            )}`}
                          >
                            {getChangeTypeLabel(change.change_type)}
                          </span>
                        </div>

                        <div className="mb-2">
                          <p className="font-medium text-gray-800">{change.product_name}</p>
                          <p className="text-xs text-gray-500">Kod: {change.product_code}</p>
                        </div>

                        {change.old_price !== null && change.new_price !== null && (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm">
                              <TrendingDown className="w-4 h-4 text-red-600" />
                              <span className="text-red-600 line-through">
                                {change.old_price.toFixed(2)} PLN
                              </span>
                            </div>
                            <span className="text-gray-400">→</span>
                            <div className="flex items-center gap-2 text-sm">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="text-green-600 font-bold">
                                {change.new_price.toFixed(2)} PLN
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              (
                              {change.new_price > change.old_price
                                ? '+'
                                : ''}
                              {((change.new_price - change.old_price) / change.old_price * 100).toFixed(1)}
                              %)
                            </span>
                          </div>
                        )}

                        {change.change_type === 'created' && change.new_price !== null && (
                          <p className="text-sm text-green-600 font-medium">
                            Cena: {change.new_price.toFixed(2)} PLN
                          </p>
                        )}

                        {change.change_type === 'deleted' && change.old_price !== null && (
                          <p className="text-sm text-red-600">
                            Usunięto cenę: {change.old_price.toFixed(2)} PLN
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(change.created_at)}
                          </div>
                          {change.user_name && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {change.user_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-3">
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Brak przypisań w historii</p>
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(
                              assignment.action
                            )}`}
                          >
                            {getChangeTypeLabel(assignment.action)}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {getPriorityLabel(assignment.priority)}
                          </span>
                        </div>

                        <div className="mb-2">
                          {assignment.store_name && (
                            <div className="flex items-center gap-2">
                              <Store className="w-4 h-4 text-gray-600" />
                              <span className="font-medium text-gray-800">
                                {assignment.store_name}
                              </span>
                              {assignment.store_code && (
                                <span className="text-xs text-gray-500">
                                  ({assignment.store_code})
                                </span>
                              )}
                            </div>
                          )}

                          {assignment.group_name && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-600" />
                              <span className="font-medium text-gray-800">
                                Grupa: {assignment.group_name}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Od:</span> {formatDate(assignment.valid_from)}
                          </div>
                          {assignment.valid_to && (
                            <div>
                              <span className="font-medium">Do:</span> {formatDate(assignment.valid_to)}
                            </div>
                          )}
                          {!assignment.valid_to && (
                            <span className="text-green-600 font-medium">Aktywne</span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(assignment.created_at)}
                          </div>
                          {assignment.user_name && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {assignment.user_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
