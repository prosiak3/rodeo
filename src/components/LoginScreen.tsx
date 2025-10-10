import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onCreateTestUsers: () => Promise<void>;
}

const testUsers = [
  { email: 'kierownik@sklep.pl', password: 'test123', role: 'Kierownik sklepu' },
  { email: 'handlowiec@hurtownia.pl', password: 'test123', role: 'Handlowiec' },
  { email: 'operator@hurtownia.pl', password: 'test123', role: 'Operator hurtowni' },
];

export default function LoginScreen({ onLogin, onCreateTestUsers }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTestUsers, setShowTestUsers] = useState(false);
  const [creatingUsers, setCreatingUsers] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Błąd logowania. Sprawdź dane i spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
  };

  const handleCreateTestUsers = async () => {
    setCreatingUsers(true);
    setError('');
    try {
      await onCreateTestUsers();
      alert('Użytkownicy testowi zostali utworzeni! Możesz się teraz zalogować.');
    } catch (err: any) {
      setError(err.message || 'Błąd podczas tworzenia użytkowników');
    } finally {
      setCreatingUsers(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="text-7xl mb-2">🐃</div>
            <h1 className="text-3xl font-bold text-gray-800">RODEO</h1>
            <p className="text-amber-600 font-semibold mt-2 text-lg">Weź byka za rogi</p>
            <p className="text-gray-600 mt-1 text-sm">System Zamówień Mięsno-Wędliniarskich</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                placeholder="twoj@email.pl"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Hasło
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <span>Logowanie...</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Zaloguj się</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowTestUsers(!showTestUsers)}
              className="w-full text-amber-600 text-sm font-medium hover:underline"
            >
              {showTestUsers ? 'Ukryj' : 'Pokaż'} konta testowe
            </button>

            {showTestUsers && (
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-300">
                  <p className="text-sm font-semibold text-amber-900 mb-2">Ważne!</p>
                  <p className="text-xs text-amber-800 mb-3">
                    Najpierw kliknij &quot;Utwórz użytkowników testowych&quot; poniżej, a następnie zaloguj się jednym z kont.
                  </p>
                </div>

                <button
                  onClick={handleCreateTestUsers}
                  disabled={creatingUsers}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                >
                  <UserPlus className="w-5 h-5" />
                  {creatingUsers ? 'Tworzenie użytkowników...' : '1. Utwórz użytkowników testowych'}
                </button>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-3">2. Zaloguj się jako:</p>
                  <div className="space-y-2">
                    {testUsers.map((user) => (
                      <button
                        key={user.email}
                        onClick={() => handleQuickLogin(user.email, user.password)}
                        className="w-full text-left p-3 bg-white rounded-lg hover:bg-blue-50 transition border border-blue-100"
                      >
                        <p className="text-sm font-medium text-gray-800">{user.role}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">Hasło: {user.password}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">Wersja prototypowa</p>
          </div>
        </div>
      </div>
    </div>
  );
}
