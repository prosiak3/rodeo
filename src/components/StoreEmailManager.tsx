import { useState } from 'react';
import { Mail, Plus, X, Save, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StoreEmailManagerProps {
  storeId: string;
  storeName: string;
  emailAddresses: string[] | null;
  onUpdate: () => void;
}

export default function StoreEmailManager({ storeId, storeName, emailAddresses, onUpdate }: StoreEmailManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmails, setEditedEmails] = useState<string[]>(emailAddresses || []);
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setIsEditing(true);
    setEditedEmails(emailAddresses || []);
    setNewEmail('');
  };

  const addEmail = () => {
    const email = newEmail.trim();
    if (!email) return;

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      alert('Niepoprawny format adresu email');
      return;
    }

    if (editedEmails.includes(email)) {
      alert('Ten adres email już istnieje');
      return;
    }

    setEditedEmails([...editedEmails, email]);
    setNewEmail('');
  };

  const removeEmail = (emailToRemove: string) => {
    setEditedEmails(editedEmails.filter(e => e !== emailToRemove));
  };

  const saveEmails = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({ email_addresses: editedEmails })
        .eq('id', storeId);

      if (error) throw error;

      setIsEditing(false);
      onUpdate();
      alert('Adresy email zostały zaktualizowane');
    } catch (error) {
      console.error('Error updating emails:', error);
      alert('Wystąpił błąd podczas zapisywania adresów email');
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setIsEditing(false);
    setEditedEmails(emailAddresses || []);
    setNewEmail('');
  };

  if (!isEditing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {emailAddresses && emailAddresses.length > 0
                ? `${emailAddresses.length} adres${emailAddresses.length === 1 ? '' : emailAddresses.length < 5 ? 'y' : 'ów'}`
                : 'Brak adresów'}
            </span>
          </div>
          <button
            onClick={startEditing}
            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition"
            title="Edytuj adresy email"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
        {emailAddresses && emailAddresses.length > 0 && (
          <div className="pl-6 space-y-1">
            {emailAddresses.map((email, index) => (
              <div key={index} className="text-xs text-gray-600">
                {email}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Edycja adresów email: {storeName}</h4>
        <div className="flex gap-2">
          <button
            onClick={saveEmails}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Zapisz
          </button>
          <button
            onClick={cancel}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition disabled:opacity-50"
          >
            Anuluj
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addEmail()}
            placeholder="Dodaj adres email..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <button
            onClick={addEmail}
            className="flex items-center gap-1 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition"
          >
            <Plus className="w-4 h-4" />
            Dodaj
          </button>
        </div>

        {editedEmails.length > 0 && (
          <div className="space-y-2">
            {editedEmails.map((email, index) => (
              <div key={index} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-200">
                <span className="text-sm text-gray-700">{email}</span>
                <button
                  onClick={() => removeEmail(email)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                  title="Usuń"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {editedEmails.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4 bg-white rounded border border-gray-200">
            Brak adresów email. Dodaj pierwszy adres powyżej.
          </div>
        )}
      </div>
    </div>
  );
}
