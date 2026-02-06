import { API_BASE_URL } from '../config';

export const api = {
  // ==================== AUTH ====================
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
  
  // ==================== MARKETS ====================
  getMarkets: async (page = 1) => {
    const res = await fetch(`${API_BASE_URL}/markets?page=${page}`);
    return res.json();
  },
  
  getMarket: async (id) => {
    const res = await fetch(`${API_BASE_URL}/market/${id}`);
    return res.json();
  },
  
  getPriceHistory: async (marketId) => {
    const res = await fetch(`${API_BASE_URL}/market/${marketId}/price-history`);
    return res.json();
  },
  
  // ==================== TRADING ====================
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
  
  // ==================== USER ====================
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

  // ==================== LEADERBOARD ====================
  getLeaderboard: async () => {
    const res = await fetch(`${API_BASE_URL}/leaderboard`);
    return res.json();
  },

  // ==================== PREMIUM & INVITATIONS ====================
  checkInviteCode: async (code) => {
    const res = await fetch(`${API_BASE_URL}/auth/check-invite-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    return res.json();
  },

  upgradeToPremium: async (token, inviteCode) => {
    const res = await fetch(`${API_BASE_URL}/auth/upgrade-to-premium`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ invite_code: inviteCode })
    });
    return res.json();
  },

  updatePremiumProfile: async (token, profileData) => {
    const res = await fetch(`${API_BASE_URL}/user/update-premium-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    return res.json();
  },

  getAnalystProfile: async (slug) => {
    const res = await fetch(`${API_BASE_URL}/analyst/${slug}`);
    return res.json();
  },

  // ==================== ADMIN - INVITE CODES ====================
  getInviteCodes: async (token) => {
    const res = await fetch(`${API_BASE_URL}/admin/invite-codes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  generateInviteCode: async (token, codeData) => {
    const res = await fetch(`${API_BASE_URL}/admin/generate-invite-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(codeData)
    });
    return res.json();
  },

  adminUpgradeUser: async (token, userId) => {
    const res = await fetch(`${API_BASE_URL}/admin/upgrade-user/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return res.json();
  },

  // ==================== ADMIN - MARKET CREATION ====================
  createMarket: async (token, marketData) => {
    const res = await fetch(`${API_BASE_URL}/admin/create-market`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(marketData)
    });
    return res.json();
  },
};

// ==================== LMSR HELPER FUNCTION ====================
export const calculateCost = (b, qYesBefore, qNoBefore, outcome, shares) => {
  const costBefore = b * Math.log(Math.exp(qYesBefore / b) + Math.exp(qNoBefore / b));
  
  const qYesAfter = outcome === 'YES' ? qYesBefore + shares : qYesBefore;
  const qNoAfter = outcome === 'NO' ? qNoBefore + shares : qNoBefore;
  
  const costAfter = b * Math.log(Math.exp(qYesAfter / b) + Math.exp(qNoAfter / b));
  
  return costAfter - costBefore;
};