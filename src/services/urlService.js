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
      data = { error: text || 'Server connection error.' };
    }
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `Server returned error (${res.status})`;
    throw new Error(errorMsg);
  }

  return data;
};

export const getUrls = async (token) => {
  const res = await fetch(`${API_BASE}/api/urls`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

export const createUrl = async (token, payload) => {
  const res = await fetch(`${API_BASE}/api/urls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
};

export const updateUrl = async (token, urlId, payload) => {
  const res = await fetch(`${API_BASE}/api/urls/${urlId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
};

export const deleteUrl = async (token, urlId) => {
  const res = await fetch(`${API_BASE}/api/urls/${urlId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

export const getAnalytics = async (token, urlId) => {
  const res = await fetch(`${API_BASE}/api/urls/${urlId}/analytics`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

export const getExportCsvUrl = (urlId) => {
  return `${API_BASE}/api/urls/${urlId}/analytics/export`;
};

export const bulkCreateUrls = async (token, urls) => {
  const res = await fetch(`${API_BASE}/api/urls/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ urls })
  });
  return handleResponse(res);
};

export const exportAnalyticsCsv = async (token, urlId) => {
  const res = await fetch(`${API_BASE}/api/urls/${urlId}/analytics/export`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error('Failed to export CSV');
  }
  return res.blob();
};
