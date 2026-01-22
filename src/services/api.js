import { API_BASE_URL } from '../config';

export const api = {
  // Auth
  register: async (username, email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    return res.json();
  },
  
  login: async (username, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },
  
  // Markets
  getMarkets: async (page = 1) => {
    const res = await fetch(`${API_BASE_URL}/markets?page=${page}`);
    return res.json();
  },
  
  getMarket: async (id) => {
    const res = await fetch(`${API_BASE_URL}/market/${id}`);
    return res.json();
  },
  
  // Trading
  buyShares: async (token, marketId, outcome, shares) => {
    const res = await fetch(`${API_BASE_URL}/market/${marketId}/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ outcome, shares })
    });
    return res.json();
  },
  
  // User
  getProfile: async (token) => {
    const res = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },
  
  getPositions: async (token) => {
    const res = await fetch(`${API_BASE_URL}/user/positions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },
  
  getBuyHistory: async (token, page = 1) => {
    const res = await fetch(`${API_BASE_URL}/user/buy-history?page=${page}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  getLeaderboard: async () => {
    const res = await fetch(`${API_BASE_URL}/leaderboard`);
    return res.json();
  },
  
  getPriceHistory: async (marketId) => {
    const res = await fetch(`${API_BASE_URL}/market/${marketId}/price-history`); return res.json();
  },
};

// LMSR helper function
export const calculateCost = (b, qYesBefore, qNoBefore, outcome, shares) => {
  const costBefore = b * Math.log(Math.exp(qYesBefore / b) + Math.exp(qNoBefore / b));
  
  const qYesAfter = outcome === 'YES' ? qYesBefore + shares : qYesBefore;
  const qNoAfter = outcome === 'NO' ? qNoBefore + shares : qNoBefore;
  
  const costAfter = b * Math.log(Math.exp(qYesAfter / b) + Math.exp(qNoAfter / b));
  
  return costAfter - costBefore;
};