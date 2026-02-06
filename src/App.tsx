import React, { useState, useEffect } from 'react';
import { TrendingUp, LogIn, LogOut, User, Wallet, AlertCircle, CheckCircle, Info, Menu, X, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api, calculateCost } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('markets');
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [analystSlug, setAnalystSlug] = useState(null);

  useEffect(() => {
    console.log('useEffect triggered. Token:', token);
    if (token) {
      console.log('Token exists, calling loadUser...');
      loadUser();
    } else {
      console.log('No token found');
    }
    loadMarkets();
  }, [token]);

  useEffect(() => {
    if (error) setTimeout(() => setError(null), 5000);
  }, [error]);

  useEffect(() => {
    if (success) setTimeout(() => setSuccess(null), 5000);
  }, [success]);

  useEffect(() => {
    console.log('App mounted');
    console.log('Token:', token);
    console.log('User', user);
  }, []);

  const loadUser = async () => {
    try {
      const data = await api.getProfile(token);
      console.log('loadUser response:', data); 
      if (data.success) {
        console.log('Setting user:', data.user);
        setUser(data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.log('loadUser error:', err);
      logout();
    }
  };

  const loadMarkets = async () => {
    setLoading(true);
    try {
      const data = await api.getMarkets();
      if (data.success) setMarkets(data.markets);
    } catch (err) {
      setError('Error cargando mercados');
    } finally {
      setLoading(false);
    }
  };

  const loadPositions = async () => {
    if (!token) return;
    try {
      const data = await api.getPositions(token);
      if (data.success) setPositions(data.positions);
    } catch (err) {
      setError('Error cargando posiciones');
    }
  };

  const loadTrades = async () => {
    if (!token) return;
    try {
      const data = await api.getBuyHistory(token);
      if (data.success) setTrades(data.trades);
    } catch (err) {
      setError('Error cargando historial');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setView('markets');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        key={user?.id || 'no-user'}
        user={user} 
        view={view} 
        setView={setView} 
        logout={logout}
        loadPositions={loadPositions}
        loadTrades={loadTrades}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {error && <Notification type="error" message={error} />}
      {success && <Notification type="success" message={success} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'markets' && (
          <MarketsView
            markets={markets}
            onSelectMarket={(m) => { setSelectedMarket(m); setView('trade'); }}
            loading={loading}
          />
        )}

        {view === 'trade' && selectedMarket && (
          <TradeView
            market={selectedMarket}
            user={user}
            token={token}
            onBack={() => { setView('markets'); setSelectedMarket(null); }}
            onSuccess={(msg) => { setSuccess(msg); loadUser(); }}
            onError={setError}
          />
        )}

        {view === 'portfolio' && (
          <PortfolioView positions={positions} user={user} />
        )}

        {view === 'history' && (
          <HistoryView trades={trades} />
        )}

        {view === 'leaderboard' && (
          <LeaderboardView setAnalystSlug={setAnalystSlug} setView={setView} />
        )}

        {view === 'upgrade-premium' && user && !user.is_premium && (
          <UpgradeToPremiumView
            user={user}
            token={token}
            onSuccess={(msg) => { setSuccess(msg); }}
            onError={setError}
            onBack={() => setView('markets')}
          />
        )}

        {view === 'analyst-profile' && analystSlug && (
          <AnalystProfileView
            slug={analystSlug}
            currentUser={user}
            setView={setView}
            onBack={() => { setView('markets'); setAnalystSlug(null); }}
          />
        )}

        {view === 'edit-premium-profile' && user && user.is_premium && (
          <EditPremiumProfileView
            user={user}
            token={token}
            onBack={() => setView('analyst-profile')}
            onSuccess={(msg) => { setSuccess(msg); }}
            onError={setError}
          />
        )}

        {view === 'admin' && user && user.role === 'admin' && (
          <AdminPanelView
            user={user}
            token={token}
            setView={setView}
            onSuccess={(msg) => { setSuccess(msg); }}
            onError={setError}
          />
        )}

        {view === 'create-market' && user && user.role === 'admin' && (
          <CreateMarketView
            token={token}
            onSuccess={(msg) => { setSuccess(msg); setView('admin'); }}
            onError={setError}
            onBack={() => setView('admin')}
          />
        )}

        {view === 'login' && (
          <AuthView
            onLogin={(token, user) => {
              setToken(token);
              setUser(user);
              localStorage.setItem('token', token);
              setView('markets');
              setSuccess('¡Bienvenido!');
            }}
            onError={setError}
          />
        )}
      </main>
    </div>
  );
}

function Header({ user, view, setView, logout, loadPositions, loadTrades, mobileMenuOpen, setMobileMenuOpen }) {
  console.log('Header render - user:', user);
  console.log('is_premium:', user?.is_premium);
  console.log('Should show button:', user && !user.is_premium);
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">PredicciónCO</span>
          </div>

          <nav className="hidden md:flex space-x-8">
            <button onClick={() => setView('markets')} className={`px-3 py-2 text-sm font-medium ${view === 'markets' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>
              Mercados
            </button>

            <button onClick={() => setView('leaderboard')} className={`px-3 py-2 text-sm font-medium ${view === 'leaderboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>
              🏆 Leaderboard
            </button>

            {user && user.role === 'admin' && (
              <button onClick={() => setView('admin')} className={`px-3 py-2 text-sm font-medium ${view === 'admin' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>
                ⚙️ Admin
              </button>
            )}

            {user && (
              <>
                <button onClick={() => { setView('portfolio'); loadPositions(); }} className={`px-3 py-2 text-sm font-medium ${view === 'portfolio' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>
                  Portafolio
                </button>
                <button onClick={() => { setView('history'); loadTrades(); }} className={`px-3 py-2 text-sm font-medium ${view === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>
                  Historial
                </button>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user && !user.is_premium && (
              <button 
                onClick={() => setView('upgrade-premium')} 
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <span>✨</span>
                <span>Upgrade to Premium</span>
              </button>
            )}
                 
            {user ? (
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-lg">
                  <Wallet className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-700">{user.points_balance.toFixed(2)} pts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{user.username}</span>
                </div>
                <button onClick={logout} className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                  <LogOut className="w-4 h-4" />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <button onClick={() => setView('login')} className="hidden md:flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <LogIn className="w-4 h-4" />
                <span>Ingresar</span>
              </button>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-600">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-2">
              <button onClick={() => { setView('markets'); setMobileMenuOpen(false); }} className="px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg">Mercados</button>
              
              <button onClick={() => { setView('leaderboard'); setMobileMenuOpen(false); }} className="px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg">🏆 Leaderboard</button>

              {user && user.role === 'admin' && (
                <button onClick={() => { setView('admin'); setMobileMenuOpen(false); }} className="px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg">⚙️ Admin</button>
              )}
              
              {user && (
                <>
                  {!user.is_premium && (
                    <button 
                      onClick={() => { setView('upgrade-premium'); setMobileMenuOpen(false); }}
                      className="px-3 py-2 text-left text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold"
                    >
                      ✨ Upgrade to Premium
                    </button>
                  )}
                  <button onClick={() => { setView('portfolio'); loadPositions(); setMobileMenuOpen(false); }} className="px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg">Portafolio</button>
                  <button onClick={() => { setView('history'); loadTrades(); setMobileMenuOpen(false); }} className="px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg">Historial</button>
                  <div className="px-3 py-2 flex justify-between">
                    <span className="text-sm font-medium">{user.username}</span>
                    <span className="font-semibold text-green-700">{user.points_balance.toFixed(2)} pts</span>
                  </div>
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg">Salir</button>
                </>
              )}
              {!user && (
                <button onClick={() => { setView('login'); setMobileMenuOpen(false); }} className="px-3 py-2 text-left text-blue-600 hover:bg-blue-50 rounded-lg">Ingresar</button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function Notification({ type, message }) {
  const isError = type === 'error';
  return (
    <div className={`fixed top-20 right-4 z-50 max-w-md ${isError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4 shadow-lg`}>
      <div className="flex items-start">
        {isError ? <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" /> : <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />}
        <p className={`ml-3 text-sm font-medium ${isError ? 'text-red-800' : 'text-green-800'}`}>{message}</p>
      </div>
    </div>
  );
}

function MarketsView({ markets, onSelectMarket, loading }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'trending', label: 'Trending', icon: '🔥' },
    { id: 'new', label: 'New', icon: '✨' },
    { id: 'all', label: 'All', icon: '📊' },
    { id: 'politica', label: 'Politics', icon: '🏛️' },
    { id: 'deportes', label: 'Sports', icon: '⚽' },
    { id: 'crypto', label: 'Crypto', icon: '₿' },
    { id: 'economia', label: 'Economics', icon: '📈' },
    { id: 'geopolitica', label: 'Geopolitics', icon: '🌍' },
  ];

  let filtered = markets.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedCategory === 'trending') {
    filtered = [...filtered].sort((a, b) => (b.total_liquidity || 0) - (a.total_liquidity || 0));
  } else if (selectedCategory === 'new') {
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });
  } else if (selectedCategory !== 'all') {
    filtered = filtered.filter(m => m.category === selectedCategory);
  }

  if (loading) return <div className="text-center py-12">Cargando mercados...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mercados de Predicción</h1>
        <p className="text-gray-600">Compra acciones en los resultados que crees más probables</p>
        
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="ml-3 text-sm text-blue-800">
              <strong>Sistema de solo compra:</strong> Solo puedes comprar acciones YES o NO. No se permite vender.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        placeholder="Buscar mercados..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 mb-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(m => (
          <MarketCard key={m.id} market={m} onClick={() => onSelectMarket(m)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No se encontraron mercados en esta categoría
        </div>
      )}
    </div>
  );
}

function MarketCard({ market, onClick }) {
  const priceYes = market.price_yes || 0.5;
  const priceNo = market.price_no || 0.5;
  const closeDate = new Date(market.close_time);
  const days = Math.ceil((closeDate - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div onClick={onClick} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{market.title}</h3>
      {market.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{market.description}</p>}

      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">YES</span>
          <span className="text-lg font-bold text-green-600">{(priceYes * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${priceYes * 100}%` }} />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">NO</span>
          <span className="text-lg font-bold text-red-600">{(priceNo * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-red-500 h-2 rounded-full" style={{ width: `${priceNo * 100}%` }} />
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>Liquidez: {(market.total_liquidity || 0).toFixed(0)}</span>
        <span>{days > 0 ? `${days}d` : 'Cerrado'}</span>
      </div>
    </div>
  );
}

function TradeView({ market, user, token, onBack, onSuccess, onError }) {
  const [outcome, setOutcome] = useState('YES');
  const [shares, setShares] = useState('');
  const [cost, setCost] = useState(0);
  const [buying, setBuying] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);

  useEffect(() => {
    const loadPriceHistory = async () => {
      try {
        const data = await api.getPriceHistory(market.id);
        if (data.success) {
          setPriceHistory(data.price_history);
        }
      } catch (err) {
        console.error('Failed to load price history');
      }
    };
    loadPriceHistory();
  }, [market.id]);

  useEffect(() => {
    if (shares && !isNaN(parseFloat(shares))) {
      const c = calculateCost(100, market.q_yes || 0, market.q_no || 0, outcome, parseFloat(shares));
      setCost(c);
    } else {
      setCost(0);
    }
  }, [shares, outcome]);

  const handleBuy = async () => {
    if (!user) {
      onError('Debes iniciar sesión');
      return;
    }
    if (!shares || parseFloat(shares) <= 0) {
      onError('Cantidad inválida');
      return;
    }
    if (cost > user.points_balance) {
      onError('Saldo insuficiente');
      return;
    }

    setBuying(true);
    try {
      const result = await api.buyShares(token, market.id, outcome, parseFloat(shares));
      if (result.success) {
        onSuccess(`¡Compra exitosa! Gastaste ${result.cost.toFixed(2)} puntos`);
        onBack();
      } else {
        onError(result.error || 'Error en compra');
      }
    } catch (err) {
      onError('Error de conexión');
    } finally {
      setBuying(false);
    }
  };

  const priceYes = market.price_yes || 0.5;
  const priceNo = market.price_no || 0.5;

  const chartData = priceHistory.map(point => ({
    time: new Date(point.timestamp).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    YES: (point.price_yes * 100).toFixed(1),
    NO: (point.price_no * 100).toFixed(1),
  }));

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="mb-6 text-blue-600 hover:text-blue-700 font-medium flex items-center">
        <ArrowLeft className="w-4 h-4 mr-1" /> Volver
      </button>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">{market.title}</h1>
        {market.description && <p className="text-gray-700 mb-4">{market.description}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-sm text-green-700 mb-1">Precio YES</div>
          <div className="text-3xl font-bold text-green-600">{(priceYes * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-sm text-red-700 mb-1">Precio NO</div>
          <div className="text-3xl font-bold text-red-600">{(priceNo * 100).toFixed(1)}%</div>
        </div>
      </div>

      {priceHistory.length > 1 && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Historial de Precios</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} label={{ value: 'Probabilidad (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value) => `${value}%`}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Line type="monotone" dataKey="YES" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="NO" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-bold mb-4">Comprar Acciones</h2>

        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">Debes iniciar sesión para comprar</p>
          </div>
        )}

        {user && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">Tu balance:</span>
              <span className="font-semibold">{user.points_balance.toFixed(2)} pts</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resultado</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setOutcome('YES')}
                className={`p-4 rounded-lg border-2 ${outcome === 'YES' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
              >
                <div className="font-semibold">YES</div>
                <div className="text-sm text-gray-600">{(priceYes * 100).toFixed(1)}%</div>
              </button>
              <button
                onClick={() => setOutcome('NO')}
                className={`p-4 rounded-lg border-2 ${outcome === 'NO' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
              >
                <div className="font-semibold">NO</div>
                <div className="text-sm text-gray-600">{(priceNo * 100).toFixed(1)}%</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad de acciones</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="Ej: 10"
              min="0.01"
              step="0.01"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {cost > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900">Costo estimado:</span>
                <span className="text-lg font-bold text-blue-600">{cost.toFixed(2)} pts</span>
              </div>
            </div>
          )}

          <button
            onClick={handleBuy}
            disabled={!user || buying || !shares || cost > (user?.points_balance || 0)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {buying ? 'Comprando...' : 'Comprar Acciones'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PortfolioView({ positions, user }) {
  if (!user) return <div className="text-center py-12">Inicia sesión para ver tu portafolio</div>;
  
  const totalValue = positions.reduce((sum, p) => sum + p.current_value, 0);
  const totalInvested = positions.reduce((sum, p) => sum + p.total_invested, 0);
  const totalPL = totalValue - totalInvested;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Mi Portafolio</h1>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Balance</div>
          <div className="text-2xl font-bold">{user.points_balance.toFixed(2)} pts</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Valor Posiciones</div>
          <div className="text-2xl font-bold">{totalValue.toFixed(2)} pts</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">P&L Total</div>
          <div className={`text-2xl font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalPL >= 0 ? '+' : ''}{totalPL.toFixed(2)} pts
          </div>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No tienes posiciones activas</div>
      ) : (
        <div className="space-y-4">
          {positions.map((pos, i) => (
            <div key={i} className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold mb-4">{pos.market_title}</h3>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Acciones YES</div>
                  <div className="font-semibold">{pos.shares_yes.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Acciones NO</div>
                  <div className="font-semibold">{pos.shares_no.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Invertido</div>
                  <div className="font-semibold">{pos.total_invested.toFixed(2)} pts</div>
                </div>
                <div>
                  <div className="text-gray-600">Valor Actual</div>
                  <div className="font-semibold">{pos.current_value.toFixed(2)} pts</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryView({ trades }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Historial de Compras</h1>

      {trades.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No has realizado compras</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mercado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resultado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trades.map(t => (
                <tr key={t.id}>
                  <td className="px-6 py-4 text-sm">{t.market_title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${t.outcome === 'YES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {t.outcome}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{t.shares.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">{t.cost.toFixed(2)} pts</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(t.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeaderboardView({ setAnalystSlug, setView }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await api.getLeaderboard();
        if (data.success) {
          setLeaderboard(data.leaderboard);
        }
      } catch (err) {
        console.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    loadLeaderboard();
  }, []);

  if (loading) return <div className="text-center py-12">Cargando leaderboard...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">🏆 Leaderboard</h1>
      
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Worth</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">P&L</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mercados</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trades</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {leaderboard.map(entry => (
              <tr 
                key={entry.user_id} 
                className={`${entry.rank <= 3 ? 'bg-yellow-50' : ''} hover:bg-blue-50 cursor-pointer transition-colors`}
                onClick={() => {
                  if (entry.profile_slug) {
                    setAnalystSlug(entry.profile_slug);
                    setView('analyst-profile');
                  }
                }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {entry.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                    {entry.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                    {entry.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                    <span className="font-semibold text-gray-900">#{entry.rank}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {entry.profile_image_url ? (
                      <img 
                        src={entry.profile_image_url} 
                        alt={entry.display_name || entry.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {entry.display_name || entry.username}
                        </span>
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">
                          ✨ PREMIUM
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">@{entry.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-blue-600">{entry.net_worth.toFixed(2)} pts</div>
                </td>
                <td className="px-6 py-4">
                  <div className={`font-semibold ${entry.total_pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.total_pl >= 0 ? '+' : ''}{entry.total_pl.toFixed(2)}
                  </div>
                  {entry.roi !== undefined && (
                    <div className="text-xs text-gray-500">
                      ROI: {entry.roi >= 0 ? '+' : ''}{entry.roi.toFixed(1)}%
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-700">{entry.markets_traded}</td>
                <td className="px-6 py-4 text-gray-700">{entry.total_trades}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuthView({ onLogin, onError }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = isLogin 
        ? await api.login(username, password)
        : await api.register(username, email, password);

      if (result.success) {
        onLogin(result.token, result.user);
      } else {
        onError(result.error || 'Error en autenticación');
      }
    } catch (err) {
      onError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg border p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? 'Iniciar Sesión' : 'Registro'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300"
          >
            {loading ? 'Procesando...' : (isLogin ? 'Ingresar' : 'Registrarse')}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700"
        >
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  );
}

function UpgradeToPremiumView({ user, token, onSuccess, onError, onBack }) {
  const [inviteCode, setInviteCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [codeValid, setCodeValid] = useState(null);

  const handleCheckCode = async () => {
    if (!inviteCode.trim()) {
      onError('Ingresa un código de invitación');
      return;
    }

    setChecking(true);
    try {
      const result = await api.checkInviteCode(inviteCode.trim());
      
      if (result.valid) {
        setCodeValid(true);
        onSuccess('Código válido! Ahora puedes actualizar tu cuenta');
      } else {
        setCodeValid(false);
        onError(result.error || 'Código inválido');
      }
    } catch (err) {
      onError('Error verificando código');
    } finally {
      setChecking(false);
    }
  };

  const handleUpgrade = async () => {
    if (!codeValid) {
      onError('Verifica el código primero');
      return;
    }

    setUpgrading(true);
    try {
      const result = await api.upgradeToPremium(token, inviteCode.trim());
      
      if (result.success) {
        onSuccess(`¡Bienvenido a Premium! Tu perfil: ${result.profile_url}`);
        window.location.reload();
      } else {
        onError(result.error || 'Error actualizando cuenta');
      }
    } catch (err) {
      onError('Error de conexión');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="mb-6 text-blue-600 hover:text-blue-700 font-medium flex items-center">
        <ArrowLeft className="w-4 h-4 mr-1" /> Volver
      </button>

      <div className="bg-white rounded-lg border p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Upgrade to Premium</h2>
          <p className="text-gray-600">Build your public track record and grow your audience</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-lg mb-4">Premium Benefits:</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700"><strong>Public Profile:</strong> Showcase your track record with a custom URL</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700"><strong>Performance Metrics:</strong> Detailed analytics by sport, market type, and time horizon</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700"><strong>CTA Links:</strong> Add links to your Telegram, Substack, or services</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700"><strong>Leaderboard Access:</strong> Appear in public rankings and build credibility</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700"><strong>Verified Badge:</strong> Stand out with premium verification</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Code
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value);
                  setCodeValid(null);
                }}
                placeholder="Enter your invite code"
                className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-lg"
              />
              <button
                onClick={handleCheckCode}
                disabled={checking || !inviteCode.trim()}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:bg-gray-300"
              >
                {checking ? 'Checking...' : 'Verify'}
              </button>
            </div>

            {codeValid === true && (
              <div className="mt-3 flex items-start bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-2" />
                <p className="text-sm text-green-800">Code verified! Click "Upgrade Now" to activate premium.</p>
              </div>
            )}

            {codeValid === false && (
              <div className="mt-3 flex items-start bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
                <p className="text-sm text-red-800">Invalid or expired code. Please check and try again.</p>
              </div>
            )}
          </div>

          <button
            onClick={handleUpgrade}
            disabled={!codeValid || upgrading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all"
          >
            {upgrading ? 'Upgrading...' : '✨ Upgrade to Premium Now'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-sm text-gray-500">
            Don't have an invite code?{' '}
            <a href="mailto:hello@prediccionco.com" className="text-blue-600 hover:text-blue-700 font-medium">
              Request one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function EditPremiumProfileView({ user, token, onBack, onSuccess, onError }) {
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [credentials, setCredentials] = useState(user.credentials || '');
  const [niche, setNiche] = useState(user.niche || '');
  const [profileImageUrl, setProfileImageUrl] = useState(user.profile_image_url || '');
  const [ctaLinks, setCtaLinks] = useState(user.cta_links || []);
  const [watermarkEnabled, setWatermarkEnabled] = useState(user.watermark_enabled !== false);
  const [saving, setSaving] = useState(false);

  const addCtaLink = () => {
    setCtaLinks([...ctaLinks, { label: '', url: '' }]);
  };

  const removeCtaLink = (index) => {
    setCtaLinks(ctaLinks.filter((_, i) => i !== index));
  };

  const updateCtaLink = (index, field, value) => {
    const updated = [...ctaLinks];
    updated[index][field] = value;
    setCtaLinks(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await api.updatePremiumProfile(token, {
        display_name: displayName.trim(),
        bio: bio.trim(),
        credentials: credentials.trim(),
        niche: niche.trim(),
        profile_image_url: profileImageUrl.trim(),
        cta_links: ctaLinks.filter(cta => cta.label.trim() && cta.url.trim()),
        watermark_enabled: watermarkEnabled
      });

      if (result.success) {
        onSuccess('Profile updated successfully!');
        window.location.reload(); // Reload to show updated data
      } else {
        onError(result.error || 'Error updating profile');
      }
    } catch (err) {
      onError('Connection error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="mb-6 text-blue-600 hover:text-blue-700 font-medium flex items-center">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>

      <div className="bg-white rounded-lg border p-8">
        <h1 className="text-3xl font-bold mb-6">Edit Premium Profile</h1>

        <div className="space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name (Public Name)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your real name or brand"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">This will be shown instead of your username</p>
          </div>

          {/* Profile Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Image URL
            </label>
            <input
              type="url"
              value={profileImageUrl}
              onChange={(e) => setProfileImageUrl(e.target.value)}
              placeholder="https://example.com/your-photo.jpg"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Upload your image to Imgur or similar, then paste the URL here</p>
            {profileImageUrl && (
              <div className="mt-3">
                <img src={profileImageUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-gray-300" />
              </div>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
          </div>

          {/* Credentials */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credentials / Expertise
            </label>
            <input
              type="text"
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
              placeholder="e.g., Financial Analyst | 5 years experience"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Niche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Niche / Specialties
            </label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g., NBA, EPL, Crypto Markets"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
          </div>

          {/* CTA Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call-to-Action Links
            </label>
            <div className="space-y-3">
              {ctaLinks.map((cta, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={cta.label}
                    onChange={(e) => updateCtaLink(index, 'label', e.target.value)}
                    placeholder="Button text (e.g., Join Telegram)"
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="url"
                    value={cta.url}
                    onChange={(e) => updateCtaLink(index, 'url', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeCtaLink(index)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addCtaLink}
              className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              + Add Link
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Add links to your Telegram, Substack, services, etc.
            </p>
          </div>

          {/* Watermark Toggle */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={watermarkEnabled}
                onChange={(e) => setWatermarkEnabled(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Show "Track record verified by PredicciónCO" watermark
                </span>
                <p className="text-xs text-gray-500">Recommended to keep enabled for credibility</p>
              </div>
            </label>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPanelView({ user, token, onSuccess, onError, setView }) {
  const [activeTab, setActiveTab] = useState('codes');
  const [inviteCodes, setInviteCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Generate code form
  const [newCode, setNewCode] = useState('');
  const [maxUses, setMaxUses] = useState(1);
  const [expireDays, setExpireDays] = useState('');
  const [generating, setGenerating] = useState(false);
  
  // Manual upgrade
  const [upgradeUserId, setUpgradeUserId] = useState('');
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadInviteCodes();
  }, []);

  const loadInviteCodes = async () => {
    setLoading(true);
    try {
      const result = await api.getInviteCodes(token);
      if (result.success) {
        setInviteCodes(result.codes);
      } else {
        onError('Error loading invite codes');
      }
    } catch (err) {
      onError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async (e) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const result = await api.generateInviteCode(token, {
        code: newCode.trim() || undefined,
        max_uses: maxUses,
        expires_days: expireDays ? parseInt(expireDays) : undefined
      });

      if (result.success) {
        onSuccess(`Code generated: ${result.code.code}`);
        setNewCode('');
        setMaxUses(1);
        setExpireDays('');
        loadInviteCodes();
      } else {
        onError(result.error || 'Error generating code');
      }
    } catch (err) {
      onError('Connection error');
    } finally {
      setGenerating(false);
    }
  };

  const handleManualUpgrade = async (e) => {
    e.preventDefault();
    
    if (!upgradeUserId.trim()) {
      onError('User ID required');
      return;
    }

    setUpgrading(true);
    try {
      const result = await api.adminUpgradeUser(token, parseInt(upgradeUserId));
      
      if (result.success) {
        onSuccess(`User ${upgradeUserId} upgraded to premium!`);
        setUpgradeUserId('');
      } else {
        onError(result.error || 'Error upgrading user');
      }
    } catch (err) {
      onError('Connection error');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage invite codes and premium users</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('codes')}
          className={`px-4 py-2 font-medium ${activeTab === 'codes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        >
          Invite Codes
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-2 font-medium ${activeTab === 'generate' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        >
          Generate Code
        </button>
        <button
          onClick={() => setActiveTab('upgrade')}
          className={`px-4 py-2 font-medium ${activeTab === 'upgrade' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        >
          Manual Upgrade
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botón clickeado!');
            if (typeof setView === 'function') {
              console.log('setView es una función, llamando...');
              setView('create-market');
            } else {
              console.error('setView NO es una función:', setView);
            }
          }}
          className="px-4 py-2 font-medium text-green-600 hover:text-green-700"
        >
          + Create Market
        </button>
      </div>

      {/* Invite Codes List */}
      {activeTab === 'codes' && (
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">Invite Codes</h2>
            <button
              onClick={loadInviteCodes}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : inviteCodes.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No invite codes yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Uses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {inviteCodes.map(code => (
                    <tr key={code.code}>
                      <td className="px-6 py-4">
                        <code className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">
                          {code.code}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm">{code.current_uses}</td>
                      <td className="px-6 py-4 text-sm">{code.max_uses}</td>
                      <td className="px-6 py-4 text-sm">
                        {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          code.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {code.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {code.created_at ? new Date(code.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Generate Code Form */}
      {activeTab === 'generate' && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-6">Generate New Invite Code</h2>

          <form onSubmit={handleGenerateCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Code (optional)
              </label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Leave empty for random code"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                If empty, a random code will be generated
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Uses
              </label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value))}
                min="1"
                max="100"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                How many times this code can be used (1-100)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expires In (days, optional)
              </label>
              <input
                type="number"
                value={expireDays}
                onChange={(e) => setExpireDays(e.target.value)}
                placeholder="Leave empty for no expiration"
                min="1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for code that never expires
              </p>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300"
            >
              {generating ? 'Generating...' : 'Generate Code'}
            </button>
          </form>
        </div>
      )}

      {/* Manual Upgrade Form */}
      {activeTab === 'upgrade' && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-6">Manual Premium Upgrade</h2>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This bypasses the invite code system and directly upgrades a user to premium.
            </p>
          </div>

          <form onSubmit={handleManualUpgrade} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="number"
                value={upgradeUserId}
                onChange={(e) => setUpgradeUserId(e.target.value)}
                placeholder="Enter user ID (e.g., 5)"
                min="1"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                The numeric ID of the user to upgrade
              </p>
            </div>

            <button
              type="submit"
              disabled={upgrading}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300"
            >
              {upgrading ? 'Upgrading...' : 'Upgrade User to Premium'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function CreateMarketView({ token, onSuccess, onError, onBack }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [resolutionCriteria, setResolutionCriteria] = useState('');
  const [sources, setSources] = useState('');
  const [notes, setNotes] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [resolveDeadline, setResolveDeadline] = useState('');
  const [b, setB] = useState('100');
  const [maxSharesPerBuy, setMaxSharesPerBuy] = useState('10000');
  const [maxPositionPerUser, setMaxPositionPerUser] = useState('100000');
  const [creating, setCreating] = useState(false);

  const categories = [
    { id: 'general', label: 'General', icon: '📊' },
    { id: 'politica', label: 'Política', icon: '🏛️' },
    { id: 'deportes', label: 'Deportes', icon: '⚽' },
    { id: 'crypto', label: 'Crypto', icon: '₿' },
    { id: 'economia', label: 'Economía', icon: '📈' },
    { id: 'geopolitica', label: 'Geopolítica', icon: '🌍' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !resolutionCriteria.trim() || !sources.trim() || !closeTime || !resolveDeadline) {
      onError('Completa todos los campos requeridos');
      return;
    }

    setCreating(true);
    try {
      const result = await api.createMarket(token, {
        title: title.trim(),
        description: description.trim(),
        category,
        resolution_criteria: resolutionCriteria.trim(),
        sources: sources.trim(),
        notes: notes.trim(),
        close_time: closeTime,
        resolve_deadline: resolveDeadline,
        b: parseFloat(b),
        max_shares_per_buy: parseFloat(maxSharesPerBuy),
        max_long_position_per_user: parseFloat(maxPositionPerUser)
      });

      if (result.success) {
        onSuccess(`Mercado creado: ${result.market.title}`);
        // Reset form
        setTitle('');
        setDescription('');
        setCategory('general');
        setResolutionCriteria('');
        setSources('');
        setNotes('');
        setCloseTime('');
        setResolveDeadline('');
      } else {
        onError(result.error || 'Error creando mercado');
      }
    } catch (err) {
      onError('Error de conexión');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="mb-6 text-blue-600 hover:text-blue-700 font-medium flex items-center">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Admin
      </button>

      <div className="bg-white rounded-lg border p-8">
        <h1 className="text-3xl font-bold mb-2">Create New Market</h1>
        <p className="text-gray-600 mb-6">Create a prediction market for users to trade on</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title * <span className="text-xs text-gray-500">(Question format recommended)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Bitcoin alcanzará $150k antes de julio 2026?"
              required
              maxLength={500}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/500 characters</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-xs text-gray-500">(optional, shown on market card)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve contexto o detalles adicionales..."
              rows={3}
              maxLength={300}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/300 characters</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-lg border-2 text-left ${
                    category === cat.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <span className="text-2xl mb-1 block">{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution Criteria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution Criteria * <span className="text-xs text-gray-500">(How will this be resolved?)</span>
            </label>
            <textarea
              value={resolutionCriteria}
              onChange={(e) => setResolutionCriteria(e.target.value)}
              placeholder="SE RESUELVE COMO SÍ si: [condiciones claras]
SE RESUELVE COMO NO si: [condiciones claras]"
              rows={6}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          {/* Sources */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Official Sources * <span className="text-xs text-gray-500">(Where will resolution data come from?)</span>
            </label>
            <textarea
              value={sources}
              onChange={(e) => setSources(e.target.value)}
              placeholder="FUENTE OFICIAL:
- CoinMarketCap
- Registraduría Nacional
- FIFA Official Website"
              rows={4}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes <span className="text-xs text-gray-500">(Internal notes, context)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales, contexto, consideraciones especiales..."
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Dates */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Close Time * <span className="text-xs text-gray-500">(Stop trading)</span>
              </label>
              <input
                type="datetime-local"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolve Deadline * <span className="text-xs text-gray-500">(Must resolve by)</span>
              </label>
              <input
                type="datetime-local"
                value={resolveDeadline}
                onChange={(e) => setResolveDeadline(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Advanced Settings</h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Liquidity (b)
                </label>
                <input
                  type="number"
                  value={b}
                  onChange={(e) => setB(e.target.value)}
                  min="10"
                  max="1000"
                  step="10"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 100</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Shares/Buy
                </label>
                <input
                  type="number"
                  value={maxSharesPerBuy}
                  onChange={(e) => setMaxSharesPerBuy(e.target.value)}
                  min="100"
                  max="50000"
                  step="100"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 10,000</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Position/User
                </label>
                <input
                  type="number"
                  value={maxPositionPerUser}
                  onChange={(e) => setMaxPositionPerUser(e.target.value)}
                  min="1000"
                  max="500000"
                  step="1000"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 100,000</p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6 border-t flex gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300"
            >
              {creating ? 'Creating...' : 'Create Market'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AnalystProfileView({ slug, onBack, currentUser, setView }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, [slug]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAnalystProfile(slug);
      if (data.success) {
        setProfile(data.profile);
      } else {
        setError(data.error || 'Profile not found');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading analyst profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Profile Not Available</h3>
          <p className="text-red-700 mb-4">{error}</p>
          {onBack && (
            <button onClick={onBack} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const { user, metrics, recent_trades, watermark } = profile;
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        {onBack && (
          <button onClick={onBack} className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Markets
          </button>
        )}
  
        {currentUser && currentUser.public_profile_slug === slug && (
          <button
            onClick={() => setView('edit-premium-profile')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>
  
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-t-lg p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative flex items-start gap-6">
          <div className="flex-shrink-0">
            {user.profile_image_url ? (
              <img 
                src={user.profile_image_url} 
                alt={user.display_name || user.username}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
                <User className="w-12 h-12 text-blue-600" />
              </div>
            )}
          </div>
  
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{user.display_name || user.username}</h1>
              <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold flex items-center gap-1">
                ✨ PREMIUM
              </span>
            </div>
  
            {user.niche && (
              <div className="flex flex-wrap gap-2 mb-3">
                {user.niche.split(',').map((n, i) => (
                  <span key={i} className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm backdrop-blur-sm">
                    {n.trim()}
                  </span>
                ))}
              </div>
            )}
  
            {user.bio && (
              <p className="text-white text-opacity-90 mb-4 max-w-2xl">{user.bio}</p>
            )}
  
            {user.credentials && (
              <p className="text-white text-opacity-75 text-sm italic">{user.credentials}</p>
            )}
          </div>
        </div>
  
        {user.cta_links && user.cta_links.length > 0 && (
          <div className="relative mt-6 flex flex-wrap gap-3">
            {user.cta_links.map((cta, i) => (
              <a

                key={i}
                href={cta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg"
              >
                {cta.label}
                <span className="text-xs">→</span>
              </a>
            ))}
          </div>
        )}
      </div>
  
      <div className="bg-white rounded-b-lg border-x border-b p-8">
        <h2 className="text-2xl font-bold mb-6">Performance Metrics</h2>
        
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="text-sm text-blue-700 mb-1">Total Predictions</div>
            <div className="text-3xl font-bold text-blue-900">{metrics.total_predictions}</div>
          </div>
  
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <div className="text-sm text-green-700 mb-1">Markets Traded</div>
            <div className="text-3xl font-bold text-green-900">{metrics.markets_traded}</div>
          </div>
  
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="text-sm text-purple-700 mb-1">Total Invested</div>
            <div className="text-3xl font-bold text-purple-900">{metrics.total_invested.toFixed(0)} pts</div>
          </div>
  
          <div className={`rounded-lg p-6 border ${metrics.profit_loss >= 0 ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200' : 'bg-gradient-to-br from-red-50 to-rose-100 border-red-200'}`}>
            <div className={`text-sm mb-1 ${metrics.profit_loss >= 0 ? 'text-green-700' : 'text-red-700'}`}>Profit/Loss</div>
            <div className={`text-3xl font-bold ${metrics.profit_loss >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              {metrics.profit_loss >= 0 ? '+' : ''}{metrics.profit_loss.toFixed(0)} pts
            </div>
            <div className={`text-sm mt-1 ${metrics.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ROI: {metrics.roi >= 0 ? '+' : ''}{metrics.roi.toFixed(1)}%
            </div>
          </div>
        </div>
  
        <div>
          <h3 className="text-xl font-bold mb-4">Recent Predictions</h3>
          
          {recent_trades.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recent_trades.map((trade, i) => (
                <div key={i} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">{trade.market_title}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className={`px-2 py-0.5 rounded ${trade.outcome === 'YES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} font-semibold`}>
                          {trade.outcome}
                        </span>
                        <span>{trade.shares.toFixed(1)} shares</span>
                        <span className="text-gray-400">•</span>
                        <span>{new Date(trade.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Cost</div>
                      <div className="font-semibold">{trade.cost.toFixed(2)} pts</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  
      {watermark.enabled && (
        <div className="mt-6 text-center py-4 bg-gray-50 rounded-lg border">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{watermark.text}</span>
            {' • '}
            <a href="/" className="text-blue-600 hover:text-blue-700">
              Build your own track record →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}