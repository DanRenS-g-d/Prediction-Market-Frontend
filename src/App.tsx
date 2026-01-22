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

  useEffect(() => {
    if (token) loadUser();
    loadMarkets();
  }, [token]);

  useEffect(() => {
    if (error) setTimeout(() => setError(null), 5000);
  }, [error]);

  useEffect(() => {
    if (success) setTimeout(() => setSuccess(null), 5000);
  }, [success]);

  const loadUser = async () => {
    try {
      const data = await api.getProfile(token);
      if (data.success) {
        setUser(data.user);
      } else {
        logout();
      }
    } catch (err) {
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
          <LeaderboardView />
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
              
              {user && (
                <>
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

  // Kalshi-style categories
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

  // Filter and sort markets
  let filtered = markets.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  // Apply category filter
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

      {/* Kalshi-style Category Pills */}
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

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Buscar mercados..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 mb-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {/* Markets Grid */}
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

  // Load price history on mount
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

  // Format chart data
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

      {/* Price History Chart */}
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

function LeaderboardView() {
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
              <tr key={entry.user_id} className={entry.rank <= 3 ? 'bg-yellow-50' : ''}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {entry.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                    {entry.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                    {entry.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                    <span className="font-semibold text-gray-900">#{entry.rank}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{entry.username}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-blue-600">{entry.net_worth.toFixed(2)} pts</div>
                </td>
                <td className="px-6 py-4">
                  <div className={`font-semibold ${entry.total_pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.total_pl >= 0 ? '+' : ''}{entry.total_pl.toFixed(2)}
                  </div>
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
