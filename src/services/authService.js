const API_BASE = import.meta.env.VITE_API_URL || '';

const handleResponse = async (res) => {
  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || 'Server connection error. Make sure the backend server is running.' };
    }
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `Server returned error (${res.status})`;
    throw new Error(errorMsg);
  }

  return data;
};

export const login = async (email, password) => {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return handleResponse(res);
};

export const register = async (email, password) => {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return handleResponse(res);
};

export const googleLogin = async (payload) => {
  const body = typeof payload === 'string' ? { credential: payload } : payload;
  const res = await fetch(`${API_BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return handleResponse(res);
};

export const getMe = async (token) => {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

export const updateProfile = async (token, payload) => {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
};
